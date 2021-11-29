const dotenv = require('dotenv');
const mongoose = require('mongoose');
const say = require('say');
dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', err => {
  console.log('Uncaught Exeption: system is shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('Successful Connection'));

// const port = process.env.PORT || 3000;
const server = app.listen(3000, () => {
  console.log(`app is runnin on port 3000`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandeled Rejection: system is shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
