const User = require(`./../models/userModel`);

const catchAsync = require(`./../utils/catchAsync`);

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  res.status(201).json({
    //201 - created status
    status: 'success',
    data: {
      user: newUser,
    },
  });
});
