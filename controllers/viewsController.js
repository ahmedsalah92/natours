const mongoose = require('mongoose');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsycn');
const AppError = require('./../utils/appError');

exports.overview = async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'Natours | Exciting tours for adventurous people',
    tours
  });
};

exports.getTour = async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate('guides')
    .populate({ path: 'reviews', select: 'review user rating' });
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
};

exports.getLoginForm = async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login'
  });
};

exports.getAccount = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).render('account', {
    title: `${user.name} Account`,
    user
  });
};

exports.getMyBookings = async (req, res, next) => {
  // 1) Find all bookings of the user and get his tours' ID
  const bookings = await Booking.find({ user: req.user.id });
  console.log(Booking);
  console.log(req.user.id);
  console.log(bookings);
  const tourIds = bookings.map(el => el.tour);

  // 2) Get users' tours
  const tours = await Tour.find({ _id: { $in: tourIds } });

  // 3) Render my bookings page
  res.status(200).render('overview', {
    title: 'My Bookings',
    tours
  });
};
