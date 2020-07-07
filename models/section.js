const mongoose = require('mongoose'); // for working w/ our database
const Schema = mongoose.Schema;
const PageSchema  = require("./page.js");

const SectionSchema = new Schema({
  title: String,
  content: String,
  page: String,
  images: [String]
  
});

// return the model
module.exports = SectionSchema;
//mongoose.model('User', UserSchema);
