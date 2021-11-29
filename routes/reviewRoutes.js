const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('./../controllers/authController');

const reviewsRouter = express.Router({ mergeParams: true });

reviewsRouter.use(authController.protect);

reviewsRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setUserTourIds,
    reviewController.createReview
  );

reviewsRouter
  .route('/:id')
  .get(reviewController.getReview)
  .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview)
  .patch(authController.restrictTo('admin', 'user'), reviewController.updateReview);

module.exports = reviewsRouter;
