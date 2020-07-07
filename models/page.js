const mongoose = require('mongoose'); // for working w/ our database
const Schema = mongoose.Schema;
const SectionSchema  = require("./section.js");

const PageSchema = new Schema({

  url: { type: String, index: { unique: true }},
  name: String,
  sections: [SectionSchema],
  image:String,
  pageCategory:String
});

// return the model
module.exports = PageSchema;
//mongoose.model('User', UserSchema);
