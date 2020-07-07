const mongoose = require('mongoose'); // for working w/ our database
const Schema = mongoose.Schema;

const PageCategorySchema = new Schema({

  name: String,
  location: String
});

// return the model
module.exports = PageCategorySchema;
//mongoose.model('User', UserSchema);
