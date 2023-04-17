const express = require(`express`);
const userController = require(`./../controllers/userController`);
const authController = require(`./../controllers/authController`);
const Router = express.Router(); //declaring mounter variable

// users

Router.post('/signup', authController.signup);

Router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

Router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = Router;
