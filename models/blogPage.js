const mongoose = require('mongoose'); // for working w/ our database
const Schema = mongoose.Schema;
const EntrySchema  = require("./entry.js");

const BlogPageSchema = new Schema({

  url: { type: String, index: { unique: true }},
  name: String,
  entries: [EntrySchema],
  pageCategory:String
});

// return the model
module.exports = BlogPageSchema;
//mongoose.model('User', UserSchema);
