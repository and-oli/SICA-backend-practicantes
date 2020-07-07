let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let CambioDeEstado = new Schema({
  nuevoEstado: String,
  fecha:  String,
  observacion:String
});
let AtributoNuevo = new Schema({
  nombre: String,
  valor:  String
});


let CasoSchema = new Schema({
  // Atributos compartidos
  estado:String,
  cambiosDeEstado:[CambioDeEstado],
  ordenado: String,
  modulos:[String],
  idLote:{ type: Schema.Types.ObjectId, ref: 'Lote' },

  // Atributos análisis
  motivo:String,
  fechaAnalisis:String,
  fechaDeCargue:String,
  nroCuenta:String,
  fechaDeOperacionEnTerreno:String,
  asignacionAnalisis:String, //Fecha
  desResultado:String,
  clasificacionFinal:  String,
  obsInsp:String,
  observacionAnalisis:String,
  expediente:String,
  destino:String,
  cobro:String,
  tipoDeCobro:String,
  atributosNuevos:[AtributoNuevo],

  // Atributos liquidación:
  asignacionLiquidacion: String,
  assignment: String,
  fechaDeCargueEpica: String,
  obsLiquidacion: String,
  dolo: String,
  kwhTotales: String,
  pesosKwhRecuperacion: String,
  pesosKwhContribucion: String,
  recuperacionEnergia: String,
  recuperacionPorReintegros: String,
  subsidio: String,
  pesosCnr: String,
  cm: String,

  // Atributos Balance Macromedición

  idCodTra: String,
  fecMes: String,
  perdidas: String,
  perMac: String,
  asegurado: String,
  tipoMacromedicion: String,
  fechaRecepcion: String,
  fechaAnalisis: String,
  requiereMantenimiento: String,

  // Atributos Novedades

  motivo: String,
  servicioElectrico: String,
  fechaDeAsig: String,
  causalResultado: String,
  contratista: String,

  // Atributos Storia

  fechaGestion: String,
  hojaVida: String,
  numCli: String,
  servicio: String,
  fecha: String,
  novedades: String,
  descMun: String,
  descMunCod: String,
  direccion: String,
  geoXMean: String,
  geoYMean: String,
  tarifa: String,
  nivel: String,
  tension: String,
  factor: String,

  // Atributos Hallazgos

  nroExpediente: String,
  informeLast: String,
  barrio: String,
  numeroActa: String,
  nroComponente: String,
  desMarca: String,
  nombrePersonaAtendio: String,
  cedualAtendio: String,
  calidadAtendio: String,
  rutaLecturaFinal: String,
  nombrePropietario: String,
  fechaDeEnvio: String,

    // Atributos Informativas

    valorCargoE774:String,
    valorCargoS782: String,
    valorCargoI781: String,
    valorFinalLiquiSum:String,

});



// return the model
module.exports = CasoSchema;
