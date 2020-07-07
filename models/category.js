var mongoose = require('mongoose'); // for working w/ our database
var Schema = mongoose.Schema;

var CategorySchema = new Schema({
  name: String,
  image: String,
  description: String,
  type:String,
  main: Boolean
});

// return the model
module.exports = CategorySchema;
//mongoose.model('User', UserSchema);
