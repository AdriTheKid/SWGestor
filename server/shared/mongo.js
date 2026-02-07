const mongoose = require('mongoose');

async function connectMongo(uri){
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000
  });
  return mongoose;
}

module.exports = { connectMongo };
