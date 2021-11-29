const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');
const bookingRouter = express.Router();

bookingRouter.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = bookingRouter;
