var mongoose = require('mongoose'); // for working w/ our database
var Schema = mongoose.Schema;

var ProductSchema = new Schema({
  name: String,
  bDescription:  String,
  image:  String,
  link:  String,
  category:String,
  brand: String,
  type: String, //Home corporate
  oldPrice: String,
  price: String,
  specs: String,
  dDescription:String,
  reference:String,
  tags:String,
  characteristics:String,
  sImages:String,
  inCarousel: Boolean,
  main: Boolean
});

// return the model
module.exports = ProductSchema;
//mongoose.model('User', UserSchema);
