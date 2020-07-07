var mongoose = require('mongoose'); // for working w/ our database
var Schema = mongoose.Schema;

var CarouselSchema = new Schema({
  product_id: String,
  image: String,
  category: String
});

// return the model
module.exports = CarouselSchema;
//mongoose.model('User', UserSchema);
