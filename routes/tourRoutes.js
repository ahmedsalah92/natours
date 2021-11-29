const express = require('express');
const toursController = require('../controllers/toursController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const toursRouter = express.Router();

// nested route
toursRouter.use('/:tourId/reviews', reviewRouter);

toursRouter
  .route('/')
  .get(toursController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour
  );

toursRouter.route('/best-5-tours').get(toursController.aliasTopTours, toursController.getAllTours);

toursRouter.route('/monthly-plan/:year').get(toursController.getMonthlyPlan);

toursRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getToursWithin);

toursRouter
  .route('/:id')
  .get(toursController.getTourById)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.uploadTourImages,
    toursController.resizeTourPhoto,
    toursController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour
  );

module.exports = toursRouter;
