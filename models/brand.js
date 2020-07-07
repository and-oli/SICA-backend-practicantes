var mongoose = require('mongoose'); // for working w/ our database
var Schema = mongoose.Schema;

var BrandSchema = new Schema({
  name: String,
  image: String
});

// return the model
module.exports = BrandSchema;
//mongoose.model('User', UserSchema);
