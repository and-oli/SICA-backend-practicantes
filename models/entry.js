const mongoose = require('mongoose'); // for working w/ our database
const Schema = mongoose.Schema;

const EntrySchema = new Schema({
  title: String,
  content1: String,
  content2: String,
  content3: String,
  content4: String,
  blogPage: String,
  thumbNail: String,
  image: String,
  date:String

});

// return the model
module.exports = EntrySchema;
//mongoose.model('User', UserSchema);
