const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsycn');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');

// Configure Multer

// 1) Saving photo in memory as a buffer (to use sharp)
const storage = multer.memoryStorage();

// 2) Filter Out None Image Files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Please upload only images', 400), false);
};

// 3) Create Multer instance
const upload = multer({ storage, fileFilter });

// 4) Export The Upload Middleware Function
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// 5) Export Resize Middleware Function
exports.resizeTourPhoto = catchAsync(async (req, res, next) => {
  if (!req.files) return next();

  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (image, i) => {
      const imageName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageName}`);

      req.body.images.push(imageName);
    })
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage price';
  req.query.page = 1;
  req.query.fields = 'name price ratingsAverage';
  next();
};

exports.getTourById = factory.getById(Tour, { path: 'guides', select: '-__v' });
exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.create(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.delete(Tour);

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        toursCountPerMonth: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    { $sort: { toursCountPerMonth: -1 } },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } }
  ]);

  res.status(200).json({
    results: plan.length,
    status: 'success',
    data: { plan }
  });
});

exports.getToursWithin = async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    new AppError('please provide coordinates in form of lat,lng', 400);
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  res.status(200).json({
    status: 'success',
    data: {
      results: tours.length,
      data: tours
    }
  });
  29.9743757481809, 30.94426385116638;
};
