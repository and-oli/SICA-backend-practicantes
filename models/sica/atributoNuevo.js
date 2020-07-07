let mongoose = require('mongoose'); // for working w/ our database
let Schema = mongoose.Schema;

let AtributoNuevoSchema = new Schema({
  nombre: String
});


// return the model
module.exports = AtributoNuevoSchema;
