let mongoose = require('mongoose'); // for working w/ our database
let Schema = mongoose.Schema;

let LoteSchema = new Schema({
  fechaSubido: String,
  casos:  String,
  estado:String,
  URLArchivo:String,
  nombreArchivo:String
});


// return the model
module.exports = LoteSchema;
