const express = require(`express`);
const fs = require(`fs`);
const userController = require(`./../controllers/userController`);
const Router = express.Router(); //declaring mounter variable

// users

Router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

Router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = Router;
