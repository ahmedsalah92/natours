const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsycn');
const factory = require('./../controllers/handlerFactory');

// Configure Multer

// 1.a) Distination and File Name (in case of direct saving to storage (without sharp))
// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, 'public/img/users');
//   },
//   filename: function(req, file, cb) {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// 1.b) Saving photo in memory as a buffer (to use sharp)
const storage = multer.memoryStorage();

// 2) Filter Out None Image Files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Please upload only images', 400), false);
};

// 3) Create Multer instance
const upload = multer({ storage, fileFilter });

// 4) Export The Upload Middleware Function
exports.uploadPhoto = upload.single('photo');

// 5) Export Resize Middleware Function
exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}.jpeg`);
  next();
});

const filterBodyObj = (requestBody, ...allowedUpdateFields) => {
  const filteredBodyObj = {};

  Object.keys(requestBody).forEach(el => {
    if (allowedUpdateFields.includes(el)) {
      filteredBodyObj[el] = requestBody[el];
    }
  });

  return filteredBodyObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Filter request body
  const filteredBodyObj = filterBodyObj(req.body, 'name', 'email');
  if (req.file) filteredBodyObj.photo = `${req.file.filename}`;

  // 2) Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBodyObj, {
    new: true,
    runValidators: true
  });

  // 3) Send response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);
  req.user = {};

  res.status(204).json({
    data: null,
    status: 'success'
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Do Not Update Password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.delete(User);
exports.getUser = factory.getById(User);
exports.getAllUsers = factory.getAll(User);
