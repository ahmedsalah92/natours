const catchAsync = require('./../utils/catchAsycn');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.delete = Model =>
  catchAsync(async (req, res, next) => {
    const rec = await Model.findByIdAndDelete(req.params.id);

    if (!rec) {
      return new AppError(`No record found`, 404);
    }

    res.status(204).json({
      status: 'success'
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const rec = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!rec) {
      return new AppError('No record found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: rec
      }
    });
  });

exports.create = Model =>
  catchAsync(async (req, res, next) => {
    const rec = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: rec
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow nested GET reviews on Tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; // 1) Excuete Query
    const features = new APIFeatures(
      Model.find()
        .populate({ path: 'guides', select: '-__v' })
        .populate({ path: 'reviews' }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .pagination();

    const docs = await features.query;

    // 2) Send Response
    res.status(200).json({
      results: docs.length,
      status: 'success',
      data: { data: docs }
    });
  });

exports.getById = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return new AppError('No doc found', 404);
    }
    res.status(200).json({
      status: 'success',
      data: { data: doc }
    });
  });
