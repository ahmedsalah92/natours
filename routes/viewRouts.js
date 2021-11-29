const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');

const viewsRouter = express.Router();
viewsRouter.use(authController.isLoggedIn);

viewsRouter.get('/', viewsController.overview);
viewsRouter.get('/tours/:slug', viewsController.getTour);
viewsRouter.get('/login', viewsController.getLoginForm);
viewsRouter.get('/me', authController.protect, viewsController.getAccount);
viewsRouter.get('/my-tours', authController.protect, viewsController.getMyBookings);

module.exports = viewsRouter;
