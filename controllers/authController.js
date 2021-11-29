const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsycn');
const AppError = require('./../utils/appError');
const catchAsycn = require('./../utils/catchAsycn');
const Email = require('./../utils/email');

const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Remove password from output
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });

  createSendToken(newUser, 201, res);
  const url = `${req.protocol}://${req.get('host')}/me`;
  new Email(newUser, url).sendWelcome();
  welcome;
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check email & password exists
  if (!email || !password) {
    return next(new AppError('Please provide an email and password', 400));
  }

  // 2) check user exists & password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isCorrectPassword(password, user.password))) {
    return next(new AppError('Incorrect username or password', 401));
  }

  // 3) login and send token
  createSendToken(user, 200, res);
});

exports.protect = catchAsycn(async (req, res, next) => {
  // 1) check token exists
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in!', 401));
  }

  // 2) verify token
  let decoded;
  const verify = promisify(jwt.verify);
  await verify(token, process.env.JWT_SECRET).then(payload => (decoded = payload));

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('This user no longer exists!', 401));

  // 4) check for recent password reset
  if (currentUser.hasPasswordChanged(decoded.iat))
    return next(new AppError('Password has changed recently', 401));

  // 5) grant access
  req.user = currentUser;
  next();
});

// only for rendering pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1) check token exists
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;
      if (!token) {
        return next();
      }

      // 2) verify token
      let decoded;
      const verify = promisify(jwt.verify);
      await verify(token, process.env.JWT_SECRET).then(payload => (decoded = payload));

      // 3) check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 4) check for recent password reset
      if (currentUser.hasPasswordChanged(decoded.iat)) return next();

      // 5) grant access
      res.locals.user = currentUser;

      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Permession to delete is not granted'), 403);
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError('There is no user with this email', 404));
  }

  // 2) Generate random reset token
  const resetToken = user.generateRandomResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

  try {
    await new Email(user, resetURL).sendResetPassword();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.PasswordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('An error occured, Can not send reset email', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Email sent successfully'
  });
});

exports.resetPassword = catchAsycn(async (req, res, next) => {
  // 1) hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) find user by token and check for expiration
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    PasswordResetExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired'));
  }

  // 3) update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.PasswordResetExpire = undefined;

  await user.save();

  // 4) login and send token
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) find user
  const user = await User.findById(req.user.id).select('+password');

  // 2) check if posted password is correct
  if (!(await user.isCorrectPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Password is incorrect', 401));

  // 3) update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) login and send token
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};
