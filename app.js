const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const toursRouter = require('./routes/tourRoutes');
const usersRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const viewsRouter = require('./routes/viewRouts');
const bookingRouter = require('./routes/bookingRoute');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global Middlewares

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security http headers
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit api requests from same IP
const limiter = rateLimiter({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests. Please try again in one hour'
});
app.use(limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Routes
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/booking', bookingRouter);

app.use('', viewsRouter);

app.get('/', (req, res, next) => {
  res.status(200).render('base');
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can not access ${req.url} on server`, 400));
});

app.use(globalErrorHandler);

module.exports = app;
