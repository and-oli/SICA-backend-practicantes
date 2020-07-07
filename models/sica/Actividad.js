let mongoose = require('mongoose'); // for working w/ our database
let Schema = mongoose.Schema;

let CambioCaso = new Schema({
  nuevoEstado: String,
  caso:  String
});

let ActividadSchema = new Schema({
  fecha: String,
  usuario:  String,
  observacion:String,
  concepto:String,//Definir constantes para saber que funcion invocar
  URLArchivo:String,
  idActividadPadre:{ type: Schema.Types.ObjectId, ref: 'Actividad' },
  profundidad:Number,
  idLote:String,
  cambiosCasos:[CambioCaso],

});


// return the model
module.exports = ActividadSchema;
