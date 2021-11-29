const express = require('express');
const userControllers = require('../controllers/usersController');
const authControllers = require('../controllers/authController');

const usersRouter = express.Router();

usersRouter.post('/signup', authControllers.signup);
usersRouter.post('/login', authControllers.login);
usersRouter.get('/logout', authControllers.logout);
usersRouter.post('/forgot-password', authControllers.forgotPassword);
usersRouter.patch('/reset-password/:token', authControllers.resetPassword);

usersRouter.use(authControllers.protect);

usersRouter.get('/me', userControllers.getMe, userControllers.getUser);
usersRouter.patch('/update-password', authControllers.updatePassword);
usersRouter.patch(
  '/update-me',
  userControllers.uploadPhoto,
  userControllers.resizePhoto,
  userControllers.updateMe
);
usersRouter.delete('/', userControllers.deleteMe);

usersRouter.use(authControllers.restrictTo('admin'));

usersRouter.route('/').get(userControllers.getAllUsers);
usersRouter
  .route('/:id')
  .get(userControllers.getUser)
  .delete(userControllers.deleteUser)
  .patch(userControllers.updateUser);

module.exports = usersRouter;
