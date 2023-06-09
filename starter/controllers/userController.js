/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable arrow-body-style */
const multer = require('multer');

const sharp = require('sharp');

const User = require('../models/userModel');

const factory = require(`./handlerFactory`);
// eslint-disable-next-line import/no-useless-path-segments

const catchAsync = require(`./../utils/catchAsync`);
const AppError = require(`./../utils/appError`);

// Configuring MULTER
// saving multer upload to memory
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('File is not an Image! Please upload only images', 404),
      false
    );
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadUserPhoto = upload.single('photo');

//Resizing images by using middleware
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  }); //loop through for keynames
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: `This route is not yet defined! Please use /signUp instead`,
  });
};

// /me endpoint
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//  Updating the cuurent user Data
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1.) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }
  // Filter out unwanted Field names not allowed to be updated without validators
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Linking the Uploaded image to the Current user using the updateMe middleware
  if (req.file) filteredBody.photo = req.file.filename;

  // 2.) Update User document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// To delete user
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);
// Do NOT uodate passwords with this
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.updateOne(User);
exports.getAllUsers = factory.getAll(User);
