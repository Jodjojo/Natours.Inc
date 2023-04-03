const mongoose = require('mongoose');

const dotenv = require(`dotenv`);
dotenv.config({ path: './starter/config.env' });
const app = require(`./app`);

mongoose.set('strictQuery', false);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// eslint-disable-next-line no-use-before-define
dbConnect().catch((err) => console.log(err));
async function dbConnect() {
  await mongoose.connect(DB);
}
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection succesful'));

// SERVER
const port = process.env.PORT || 3000; //port number
app.listen(port, `127.0.0.1`, () => {
  console.log(`App running on port ${port}...`);
}); //server listening

// console.log(process.env);
