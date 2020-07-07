let mongoose = require('mongoose'); // for working w/ our database
let Schema = mongoose.Schema;

let NotificacionesSchema = new Schema({
  codensa: Number,
  comsistelco:  Number
});

module.exports = NotificacionesSchema;
