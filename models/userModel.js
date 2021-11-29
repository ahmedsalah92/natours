const crypto = require('crypto');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'A user must have a email'],
    trim: true,
    lowercase: true,
    unique: [true, 'Email must be unique'],
    validate: [validator.isEmail, 'Please provide a correct email']
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    min: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm the password'],
    select: false,
    validate: {
      validator: function(val) {
        return val === this.password;
      },
      message: 'passwords are not the same'
    }
  },
  passwordResetToken: String,
  PasswordResetExpire: Date,
  passwordChangedAt: Date
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 2000;
  next();
});

userSchema.methods.isCorrectPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.hasPasswordChanged = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimeStamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.generateRandomResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.PasswordResetExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
