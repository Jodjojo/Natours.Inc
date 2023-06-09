const crypto = require('crypto');
const { promisify } = require('util');
// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

const User = require(`./../models/userModel`);

const catchAsync = require(`./../utils/catchAsync`);

const AppError = require(`./../utils/appError`);
const Email = require(`./../utils/email`);

const signToken = function (id) {
  // eslint-disable-next-line no-undef
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}; //jwt.sign(payload(or header), secret, expiresin) === to create the signature we use to check the jwt
// Signing up user and automatically logging in on sign up

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  // Sending JWT via cookie

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //new present date plus 90 days date converted to millisecond
    ),
    httpOnly: true,
    secure: req.secure || req.headers('x-forwarded-proto') === 'https',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  // console.log(user.role);
  res.status(statusCode).json({
    //201 - created status
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, _next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetToken: req.body.passwordResetToken,
    role: req.body.role,
  });

  // Using the email class that we created in the Email.js file to create new email
  // Specify the Url= the user account page
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});

// logging in a user on username, email and password basis
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and passwords exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2.) check if user exists and passsword is correct
  const user = await User.findOne({ email }).select('+password'); //the +password is to select a field that is normally not selected for display in DB

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); //401-unautorized status code
  }
  // 3.) if everything is okay, send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggout', {
    expires: new Date(Date.now() - 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
// Protecting the routes - only logged in users have access to all the routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1.) Getting token and check if it is exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //format for token check using headers key(authorization) and value(starter with 'Bearer token') in postman for JWT

  if (!token) {
    return next(
      new AppError(
        'You are not currently logged in! Please log in to get access.',
        401
      )
    );
  }
  // 2.) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3.)  Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The User belonging to this token does no longer exist', 401)
    );
  }
  // 4.) check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please Login again!', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// ONLY FOR RENDERED PAGES
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // 1.) Verification of token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    // 2.)  Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }
    // 3.) check if user changed password after the token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next();
    }

    // THERE IS A LOGGED IN USER
    res.locals.user = currentUser;
    return next();
  }
  next();
});

// User roles and permissions for deleting tours
// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide'], rple='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      ); //403 = forbidden
    }
    next();
  };
};

//Password reset Functionality
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1.) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // 2.) Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //used to deactivate all the validators we set in our schema

  // 3>) Send it back as an email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // using the new class to call the passsword reset function
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

// setting new password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2.) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3.) Update changedPasswordAt property for the user
  // 4.) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

// Updating the current User password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.) Get User from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2.) Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3.)if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findbyIdAndUpdate will NOT workas Intended!

  // 4.) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
