const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty']
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must have a tour']
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //Prevent dublicate user's review for the same tour

reviewSchema.pre(/^find/, function(next) {
  this.populate({ path: 'user', select: 'name -_id photo' });
  this.populate({ path: 'tour', select: 'name' });

  next();
});

reviewSchema.statics.caclAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    { $group: { _id: '$tour', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating
  });
};

reviewSchema.post('save', function() {
  // 1) this points to the current document (review)
  // 2) this.constructor points to the model of the document (review)
  this.constructor.caclAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
