const mongoose = require('mongoose');

const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsycn');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

exports.setUserTourIds = function(req, res, next) {
  // For nested route
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.create(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.delete(Review);
exports.getReview = factory.getById(Review);
