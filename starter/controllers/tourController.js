const Tour = require('../models/tourmodel');
// eslint-disable-next-line import/no-useless-path-segments
const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage,summary,difficulty';
  next();
};
// const tours = JSON.parse(
//   fs.readFileSync(`./starter/dev-data/data/tours-simple.json`)
// );

// middleware to be chained

exports.getAllTours = async (req, res) => {
  try {
    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    res.status(200).json({
      status: `success`,
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({_id: req.params.id}) //MONGOOSE FORMAT
    res.status(200).json({
      status: `success`,
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({})
    // newTour.save()

    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: `success`,
      data: {
        tours: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: `success`,
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: `success`,
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' }, //group according to different property field name...$toUpper - change to uppercase
          // _id: '$ratingsAverage',
          numRatings: { $sum: '$ratingsQuantity' }, //number of ratings
          numTours: { $sum: 1 }, //number of tours
          avgRating: { $avg: '$ratingsAverage' }, //calculating average of field(ratingsAverage)
          avgPrice: { $avg: '$price' }, //'$price' name of field with dollar sign
          minPrice: { $min: '$price' }, //calculate minimum price
          maxPrice: { $max: '$price' }, //max Price
        },
      },
      {
        $sort: { avgPrice: 1 }, //sort by ascending average price(1=ascending || -1=descending)
      },
      /*{
        $match: { _id: { $ne: 'EASY' } }, //filter documents that excluding ARE NOT easy || ne=exclude
      },*/
    ]);
    res.status(200).json({
      status: `success`,
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
