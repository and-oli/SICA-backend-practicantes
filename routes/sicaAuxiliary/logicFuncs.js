const xlsx = require("xlsx");
const casoDB = require("./DB/caso")
const loteDB = require("./DB/lote")
const actividadDB = require("./DB/actividad")
const atributoNuevoDB = require("./DB/atributoNuevo")
const fileUpload = require("../UploadImage");
const archivoDB = require("./DB/archivo")//
const fetch = require('node-fetch');
const config = require("../hid/config")


let funcs = {}
//====================== Aux functions ====================================================================================
function fileData(file) {
  uploadedFile = file.buffer;
  workbook = xlsx.read(uploadedFile, { type: "buffer" });
  range = workbook.Sheets[Object.keys(workbook.Sheets)[0]]["!ref"]; // No usado
  const cells = workbook.Sheets[Object.keys(workbook.Sheets)[0]];
  const cellsKeys = Object.keys(cells);
  const lastRow = getLastRow(cellsKeys)
  return {
    lastRow,
    cells
  }
}
function multiFileData(file) {
  uploadedFile = file.buffer;
  workbook = xlsx.read(uploadedFile, { type: "buffer" });
  range = workbook.Sheets[Object.keys(workbook.Sheets)[0]]["!ref"]; // No usado
  let cellsCollection = [];
  for (let cellKey in workbook.Sheets) {
    cellsCollection.push({ cells: workbook.Sheets[cellKey], lastRow: getLastRow(Object.keys(workbook.Sheets[cellKey])) })
  }
  return cellsCollection;
}
function fileDataFromSheet(file, sheet) {
  uploadedFile = file.buffer;
  workbook = xlsx.read(uploadedFile, { type: "buffer" });
  range = workbook.Sheets[sheet]["!ref"]; //No usado
  const cells = workbook.Sheets[sheet];
  const cellsKeys = Object.keys(cells);
  const lastRow = getLastRow(cellsKeys)
  return {
    lastRow,
    cells
  }
}

function getLastRow(cellsKeys) {
  for (let i = cellsKeys.length - 1; i >= 0; i--) {
    if (cellsKeys[i].charAt(0) !== "!") {
      return getCellNumber(cellsKeys[i])
    }
  }
}
function getCellColumnNumber(cell) {
  for (let i = 0; i < cell.length; i++) {
    if (Number.parseInt(cell[i])) {
      const letters = cell.substring(0, i)
      if (letters.length === 1) {
        return letters.charCodeAt(0) - 64
      }
      else {
        return 26 * (letters.charCodeAt(0) - 64) + letters.charCodeAt(1) - 64
      }
    }
  }
}
function getCellNumber(cell) {
  for (let i = 0; i < cell.length; i++) {
    if (Number.parseInt(cell[i])) {
      return Number.parseInt(cell.substring(i));
    }
  }
}
function arrayToObject(array, keyName) {
  let object = {};
  for (let item of array) {
    object[item[keyName]] = item;
  }
  return object;
}
function arrayToObjectSimple(array, keyName) {
  let object = {};
  for (let item of array) {
    object[item] = item;
  }
  return object;
}
function objectToArray(object) {
  let array = [];

  for (let item in object) {
    array.push(object[item]);
  }
  return array;
}
function darFecha() {
  const event = new Date();
  event.setHours(event.getUTCHours() - 5);
  return `${event.getFullYear()}/${event.getMonth() + 1}/${event.getDate()}`.toString()
}
function darFechaCompleta() {
  const event = new Date();
  event.setHours(event.getUTCHours() - 5);
  let hours = event.getHours()
  let minutes = event.getMinutes()
  let seconds = event.getSeconds()
  hours = hours < 10 ? "0" + hours : hours
  minutes = minutes < 10 ? "0" + minutes : minutes
  seconds = seconds < 10 ? "0" + seconds : seconds

  return `${event.getFullYear()}/${event.getMonth() + 1}/${event.getDate()} ${hours}:${minutes}:${seconds}`.toString()
}
function interpretar(serial0, nombreCampo) {
  if (!serial0) return "-"
  const serial = serial0 + ""
  const num = Number.parseInt(serial);
  if (num) {
    if (serial.length === 5) {
      const milis = Math.round((serial - 25569) * 86400 * 1000)//+3600*24*1000 solo para corridas locales,  pues esto va a pasar a la hora en colombia (-5gmt), cuando sube a heroku es con la fecha real
      if (1527173971106 < milis && milis < 1735707600000) {
        const event = new Date(milis);
        return `${event.getFullYear()}/${event.getMonth() + 1}/${event.getDate()}`.toString()
      }
    }
  }
  if (nombreCampo.indexOf("fecha") >= 0 || nombreCampo.indexOf("asignacion") >= 0) {
    const myEvent = new Date();
    return `${myEvent.getFullYear()}/${myEvent.getMonth() + 1}/${myEvent.getDate()}`.toString()
  }
  return serial.toString().trim()
}

/**
 * Devuelve una lista con las columnas de un modulo que estan presentes en un archivo.
 * @param {object} cells - objeto con las celdas del archivo de entrada.
 * @param {string} modulo - el modulo del cual se quieren buscar las columnas.
 */
function darColumnasEnArchivoDeAtributos(cells, modulo) {
  columnas = [];
  let cellContent = null;
  for (let property in cells) {
    cellContent = property.split(/[A-Z]+/);
    if (cellContent[1] + "" === "1") { // La primera fila.
      let atributo =
        diccionarioAtributosPorModulo[modulo]
          .find(atributo => atributo.nombreEnArchivo === (cells[property].v + "").trim());
      if (atributo) {
        columnas.push({ atributo: atributo.nombreEnDB, columna: property.match(/[A-Z]+/).join(""), nombreEnArchivo: atributo.nombreEnArchivo });
      }
    }
  }
  return columnas;
}

/**
 * Dado el formato de un lote de asignación, revisa que el archivo que se recibe contiene todas las columnas
 * esperadas y que no haya duplicados.
 * @param {*} columnasEnLote 
 * @param {*} columnasEnArchivoDeAtributos 
 */
function revisarColumnas(columnasEnLote, columnasEnArchivoDeAtributos) {

  if (columnasEnLote.length > columnasEnArchivoDeAtributos.length) {  // Revisa columnas faltantes.
    let columnasFaltantes = "";
    for (let atributo of columnasEnLote) {
      if (columnasEnArchivoDeAtributos.findIndex(c => c.atributo === atributo.nombreEnDB) === -1) {
        columnasFaltantes += atributo.nombreEnArchivo + ", "
      }
    }
    return { success: false, message: `El formato del archivo es inválido, hacen falta la(s) columna(s) ${columnasFaltantes}.` };
  }
  else if (columnasEnLote.length < columnasEnArchivoDeAtributos.length) { // Revisa columnas duplicadas.
    let columnasDuplicadas = "";
    let columnasRevisadas = {}
    for (let columna of columnasEnArchivoDeAtributos) {
      if (columnasRevisadas[columna.nombreEnArchivo]) {
        columnasDuplicadas += columna.nombreEnArchivo + ", "
      } else {
        columnasRevisadas[columna.nombreEnArchivo] = true;
      }
    }
    if (columnasDuplicadas !== "") {
      return { success: false, message: `El formato del archivo es inválido, la(s) columna(s) ${columnasDuplicadas} estan repetidas.` };
    }
    return { success: true, message: `Formato válido.` };
  }
  else {
    return { success: true, message: `Formato válido.` };
  }
}

const atributosCaso = [
  //Para agregar más agregarlos también en el modelo y en el FORMATO!
  { columna: "A", nombre: "NÚMERO_DE_", atributo: "ordenado" }, //
  { columna: "C", nombre: "NRO_CUENTA", atributo: "nroCuenta" },//
  { columna: "D", nombre: "SERVICIO_ELÉCTRICO", atributo: "servicioElectrico" },//
  { columna: "E", nombre: "FECHA_DE_OPERACIÓN_EN_TERRENO", atributo: "fechaDeOperacionEnTerreno" },//
  { columna: "M", nombre: "ASIGNACION", atributo: "asignacion" },//
  { columna: "H", nombre: "DES_RESULTADO", atributo: "desResultado" },//
  { columna: "J", nombre: "contrato", atributo: "contrato" },//
  { columna: "B", nombre: "CLASIFICACION_FINAL", atributo: "clasificacionFinal" },//
  { columna: "K", nombre: "GRUPO", atributo: "grupo" },//
  { columna: "AS", nombre: "FACTOR_ENCONTRADO", atributo: "factorEncontrado" },//
  { columna: "AA", nombre: "HALLAZGOS_AGRUPADOS_last", atributo: "hallazgosAgrupadosLast" },//
  { columna: "AB", nombre: "OBSERVACION_SOLICITUD", atributo: "observacionSolicitud" },//
  { columna: "AC", nombre: "OBS_INSP", atributo: "obsInsp" },//
  { columna: "AE", nombre: "AREA_CREA", atributo: "areaCrea" },//
  //Para agregar más agregarlos también en el modelo y en el FORMATO!
];

const diccionarioAtributosPorModulo = {
  "ANALISIS": [
    { nombreEnDB: "fechaAnalisis", nombreEnArchivo: "FECHA ANALISIS", enLoteDeAsignacion: false },
    { nombreEnDB: "fechaDeCargue", nombreEnArchivo: "FECHA DE CARGUE", enLoteDeAsignacion: false },
    { nombreEnDB: "nroCuenta", nombreEnArchivo: "NRO_CUENTA", enLoteDeAsignacion: true },
    { nombreEnDB: "fechaDeOperacionEnTerreno", nombreEnArchivo: "FECHA_DE_OPERACIÓN_EN_TERRENO", enLoteDeAsignacion: true },
    { nombreEnDB: "asignacionAnalisis", nombreEnArchivo: "ASIGNACION", enLoteDeAsignacion: true },
    { nombreEnDB: "desResultado", nombreEnArchivo: "DES_RESULTADO", enLoteDeAsignacion: true },
    { nombreEnDB: "clasificacionFinal", nombreEnArchivo: "CLASIFICACION_FINAL", enLoteDeAsignacion: true },
    { nombreEnDB: "obsInsp", nombreEnArchivo: "OBS_INSP", enLoteDeAsignacion: true },
    { nombreEnDB: "observacionAnalisis", nombreEnArchivo: "OBSERVACION  ANALISIS", enLoteDeAsignacion: false },
    { nombreEnDB: "expediente", nombreEnArchivo: "EXPEDIENTE", enLoteDeAsignacion: false },
    { nombreEnDB: "destino", nombreEnArchivo: "DESTINO", enLoteDeAsignacion: false },
    { nombreEnDB: "cobro", nombreEnArchivo: "COBRO", enLoteDeAsignacion: false },
    { nombreEnDB: "tipoDeCobro", nombreEnArchivo: "TIPO DE COBRO", enLoteDeAsignacion: false },
  ],
  "LIQUIDACION": [
    { nombreEnDB: "asignacionLiquidacion", nombreEnArchivo: "FECHA ASIGNA", enLoteDeAsignacion: true },
    { nombreEnDB: "assignment", nombreEnArchivo: "ASSIGNMENT", enLoteDeAsignacion: false },
    { nombreEnDB: "fechaDeCargueEpica", nombreEnArchivo: "FECHA DE CARGUE EPICA", enLoteDeAsignacion: false },
    { nombreEnDB: "obsLiquidacion", nombreEnArchivo: "Obs_liquidación", enLoteDeAsignacion: false },
    { nombreEnDB: "dolo", nombreEnArchivo: "DOLO", enLoteDeAsignacion: false },
    { nombreEnDB: "kwhTotales", nombreEnArchivo: "kWh TOTALES", enLoteDeAsignacion: false },
    { nombreEnDB: "pesosKwhRecuperacion", nombreEnArchivo: "$-Kwh-Recuperación", enLoteDeAsignacion: false },
    { nombreEnDB: "pesosKwhContribucion", nombreEnArchivo: "$-kWh-Contribución", enLoteDeAsignacion: false },
    { nombreEnDB: "recuperacionEnergia", nombreEnArchivo: "RECUPERACIÓN DE ENERGÍA", enLoteDeAsignacion: false },
    { nombreEnDB: "recuperacionPorReintegros", nombreEnArchivo: "CONTRIBUCION POR REINTEGROS", enLoteDeAsignacion: false },
    { nombreEnDB: "observacionAnalisis", nombreEnArchivo: "OBSERVACION  ANALISIS", enLoteDeAsignacion: false },
    { nombreEnDB: "subsidio", nombreEnArchivo: "SUBSIDIO", enLoteDeAsignacion: false },
    { nombreEnDB: "pesosCnr", nombreEnArchivo: "$CNR", enLoteDeAsignacion: false },
    { nombreEnDB: "cm", nombreEnArchivo: "C/m", enLoteDeAsignacion: false },
  ],
  "BALANCE MACROMEDICION": [
    { nombreEnDB: "idCodTra", nombreEnArchivo: "ID_COD_TRA", enLoteDeAsignacion: true },
    { nombreEnDB: "fecMes", nombreEnArchivo: "FEC_MES", enLoteDeAsignacion: true },
    { nombreEnDB: "perdidas", nombreEnArchivo: "PERDIDAS", enLoteDeAsignacion: true },
    { nombreEnDB: "perMac", nombreEnArchivo: "PER_MAC", enLoteDeAsignacion: true },
    { nombreEnDB: "asegurado", nombreEnArchivo: "ASEGURADO", enLoteDeAsignacion: true },
    { nombreEnDB: "tipoMacromedicion", nombreEnArchivo: "TIPO_MACROMEDICION", enLoteDeAsignacion: true },
    { nombreEnDB: "fechaRecepcion", nombreEnArchivo: "FECHA_RECPECION", enLoteDeAsignacion: false },
    { nombreEnDB: "fechaAnalisis", nombreEnArchivo: "FECHA_ANALISIS", enLoteDeAsignacion: false },
    { nombreEnDB: "requiereMantenimiento", nombreEnArchivo: "REQUIERE_MANTENIMIENTO", enLoteDeAsignacion: false },
  ],
  "NOVEDADES": [
    { nombreEnDB: "motivo", nombreEnArchivo: "MOTIVO", enLoteDeAsignacion: false },
    { nombreEnDB: "fechaDeCargue", nombreEnArchivo: "FECHA DE CARGUE", enLoteDeAsignacion: false },
    { nombreEnDB: "fechaDeOperacionEnTerreno", nombreEnArchivo: "FECHA_DE_OPERACIÓN_EN_TERRENO", enLoteDeAsignacion: false },
    { nombreEnDB: "servicioElectrico", nombreEnArchivo: "SERVICIO_ELÉCTRICO", enLoteDeAsignacion: true },
    { nombreEnDB: "fechaDeAsig", nombreEnArchivo: "FECHA DE ASIG", enLoteDeAsignacion: false },
    { nombreEnDB: "causalResultado", nombreEnArchivo: "Causal Resultado", enLoteDeAsignacion: false },
    { nombreEnDB: "contratista", nombreEnArchivo: "Contratista", enLoteDeAsignacion: false },
  ],
  "STORIA": [
    { nombreEnDB: "fechaGestion", nombreEnArchivo: "FECHA GESTIÓN", enLoteDeAsignacion: false },
    { nombreEnDB: "hojaVida", nombreEnArchivo: "HOJA_VIDA", enLoteDeAsignacion: true },
    { nombreEnDB: "numCli", nombreEnArchivo: "NUM_CLI", enLoteDeAsignacion: true },
    { nombreEnDB: "servicio", nombreEnArchivo: "SERVICIO", enLoteDeAsignacion: true },
    { nombreEnDB: "fecha", nombreEnArchivo: "FECHA", enLoteDeAsignacion: true },
    { nombreEnDB: "novedades", nombreEnArchivo: "NOVEDADES", enLoteDeAsignacion: true },
    { nombreEnDB: "descMun", nombreEnArchivo: "DESC_MUN", enLoteDeAsignacion: true },
    { nombreEnDB: "descMunCod", nombreEnArchivo: "DESC_MUN_COD", enLoteDeAsignacion: false },
    { nombreEnDB: "direccion", nombreEnArchivo: "DIRECCION", enLoteDeAsignacion: true },
    { nombreEnDB: "geoXMean", nombreEnArchivo: "GEO_X_mean", enLoteDeAsignacion: true },
    { nombreEnDB: "geoYMean", nombreEnArchivo: "GEO_Y_mean", enLoteDeAsignacion: true },
    { nombreEnDB: "tarifa", nombreEnArchivo: "TARIFA", enLoteDeAsignacion: true },
    { nombreEnDB: "nivel", nombreEnArchivo: "NIVEL", enLoteDeAsignacion: true },
    { nombreEnDB: "tension", nombreEnArchivo: "TENSION", enLoteDeAsignacion: true },
    { nombreEnDB: "factor", nombreEnArchivo: "FACTOR", enLoteDeAsignacion: true },
  ],
  "HALLAZGOS": [
    { nombreEnDB: "fechaGestion", nombreEnArchivo: "FECHA DE GESTIÓN", enLoteDeAsignacion: false },
    { nombreEnDB: "nroExpediente", nombreEnArchivo: "Nro_Expediente", enLoteDeAsignacion: true },
    { nombreEnDB: "nroCuenta", nombreEnArchivo: "Cuenta", enLoteDeAsignacion: true },
    { nombreEnDB: "informeLast", nombreEnArchivo: "INFORME_last", enLoteDeAsignacion: true },
    { nombreEnDB: "direccion", nombreEnArchivo: "DIRECCION", enLoteDeAsignacion: true },
    { nombreEnDB: "barrio", nombreEnArchivo: "BARRIO", enLoteDeAsignacion: true },
    { nombreEnDB: "descMun", nombreEnArchivo: "DESC_MUN", enLoteDeAsignacion: true },
    { nombreEnDB: "obsInsp", nombreEnArchivo: "OBS_INSP", enLoteDeAsignacion: false },
    { nombreEnDB: "numeroActa", nombreEnArchivo: "numeroActa", enLoteDeAsignacion: true },
    { nombreEnDB: "fechaDeOperacionEnTerreno", nombreEnArchivo: "SERVICIO_ELÉCTRICO", enLoteDeAsignacion: true },
    { nombreEnDB: "servicioElectrico", nombreEnArchivo: "TARIFA", enLoteDeAsignacion: true },
    { nombreEnDB: "nroComponente", nombreEnArchivo: "NRO_COMPONENTE", enLoteDeAsignacion: true },
    { nombreEnDB: "desMarca", nombreEnArchivo: "DES_MARCA", enLoteDeAsignacion: true },
    { nombreEnDB: "clasificacionFinal", nombreEnArchivo: "CLASIFICACION_FINAL", enLoteDeAsignacion: true },
    { nombreEnDB: "nombrePersonaAtendio", nombreEnArchivo: "NOMBRE_PERSONA_ATENDIO", enLoteDeAsignacion: true },
    { nombreEnDB: "cedualAtendio", nombreEnArchivo: "CEDUAL_ATENDIO", enLoteDeAsignacion: true },
    { nombreEnDB: "calidadAtendio", nombreEnArchivo: "CALIDAD_ATENDIO", enLoteDeAsignacion: true },
    { nombreEnDB: "rutaLecturaFinal", nombreEnArchivo: "ruta_lectura_final", enLoteDeAsignacion: true },
    { nombreEnDB: "desResultado", nombreEnArchivo: "DES_RESULTADO", enLoteDeAsignacion: true },
    { nombreEnDB: "nombrePropietario", nombreEnArchivo: "NOMBRE_PROPIETARIO", enLoteDeAsignacion: true },
    { nombreEnDB: "fechaDeEnvio", nombreEnArchivo: "FECHA DE ENVIO", enLoteDeAsignacion: false },
  ],
  "INFORMATIVAS": [
    { nombreEnDB: "fechaGestion", nombreEnArchivo: "FECHA DE GESTIÓN", enLoteDeAsignacion: false },
    { nombreEnDB: "nroExpediente", nombreEnArchivo: "Nro_Expediente", enLoteDeAsignacion: true },
    { nombreEnDB: "nroCuenta", nombreEnArchivo: "Cuenta", enLoteDeAsignacion: true },
    { nombreEnDB: "informeLast", nombreEnArchivo: "INFORME_last", enLoteDeAsignacion: true },
    { nombreEnDB: "direccion", nombreEnArchivo: "DIRECCION", enLoteDeAsignacion: true },
    { nombreEnDB: "barrio", nombreEnArchivo: "BARRIO", enLoteDeAsignacion: true },
    { nombreEnDB: "descMun", nombreEnArchivo: "DESC_MUN", enLoteDeAsignacion: true },
    { nombreEnDB: "obsInsp", nombreEnArchivo: "OBS_INSP", enLoteDeAsignacion: false },
    { nombreEnDB: "valorCargoE774", nombreEnArchivo: "VALOR_CARGO_E774", enLoteDeAsignacion: false },
    { nombreEnDB: "valorCargoS782", nombreEnArchivo: "VALOR_CARGO_S782", enLoteDeAsignacion: false },
    { nombreEnDB: "valorCargoI781", nombreEnArchivo: "VALOR_CARGO_I781", enLoteDeAsignacion: false },
    { nombreEnDB: "numeroActa", nombreEnArchivo: "numeroActa", enLoteDeAsignacion: true },
    { nombreEnDB: "fechaDeOperacionEnTerreno", nombreEnArchivo: "SERVICIO_ELÉCTRICO", enLoteDeAsignacion: true },
    { nombreEnDB: "servicioElectrico", nombreEnArchivo: "TARIFA", enLoteDeAsignacion: true },
    { nombreEnDB: "nroComponente", nombreEnArchivo: "NRO_COMPONENTE", enLoteDeAsignacion: true },
    { nombreEnDB: "desMarca", nombreEnArchivo: "DES_MARCA", enLoteDeAsignacion: true },
    { nombreEnDB: "clasificacionFinal", nombreEnArchivo: "CLASIFICACION_FINAL", enLoteDeAsignacion: true },
    { nombreEnDB: "valorFinalLiquiSum", nombreEnArchivo: "VALOR_FINAL_LIQUI_sum", enLoteDeAsignacion: true },
    { nombreEnDB: "nombrePersonaAtendio", nombreEnArchivo: "NOMBRE_PERSONA_ATENDIO", enLoteDeAsignacion: true },
    { nombreEnDB: "cedualAtendio", nombreEnArchivo: "CEDUAL_ATENDIO", enLoteDeAsignacion: true },
    { nombreEnDB: "calidadAtendio", nombreEnArchivo: "CALIDAD_ATENDIO", enLoteDeAsignacion: true },
    { nombreEnDB: "rutaLecturaFinal", nombreEnArchivo: "ruta_lectura_final", enLoteDeAsignacion: true },
    { nombreEnDB: "desResultado", nombreEnArchivo: "DES_RESULTADO", enLoteDeAsignacion: true },
    { nombreEnDB: "nombrePropietario", nombreEnArchivo: "NOMBRE_PROPIETARIO", enLoteDeAsignacion: true },
    { nombreEnDB: "fechaDeEnvio", nombreEnArchivo: "FECHA DE ENVIO", enLoteDeAsignacion: false },
  ],
};

const diccionarioEstadosPorModulo = {
  "ANALISIS": [
    "ASIGNACIÓN INCORRECTA",
    "CARGADA EPICA",
    "PARA ASIGNACIÓN LOCAL ANALISIS",
    "REMITIDO PARA CARGUE",
    "REMITIDO PARA CARGUE ODT",
    "PARA COBRO",
    "PENDIENTE ANÁLISIS",
    "PENDIENTE MOVIMIENTO",
    "GESTIONADO CODENSA",
    "DESASIGNADO CODENSA",
    "DEVUELTO CODENSA"
  ],
  "LIQUIDACION": [
    "ASIGNACIÓN INCORRECTA",
    "CARGADA EN BASE",
    "CARGADA EPICA",
    "DESASIGNADO CODENSA",
    "DEVUELTO CODENSA",
    "GESTIONADO CODENSA",
    "NO APLICA DEBIDO PROCESO",
    "PARA ASIGNACIÓN LOCAL LIQUIDACION",
    "PARA COBRO",
    "PENDIENTE CARGUE",
    "PENDIENTE LIQUIDACIÓN",
    "PENDIENTE MOVIMIENTO",
  ],
  "BALANCE MACROMEDICION": [
    "CERRADA",
    "EJECUTADO",
    "PARA ASIGNACIÓN LOCAL BALANCE MACROMEDICION",
    "PENDIENTE_EJECUCION",
  ],
  "NOVEDADES": [
    "ASIGNACION INCORRECTA",
    "CARGADA EPICA",
    "DESASIGNADO CODENSA",
    "DEVUELTO CODENSA",
    "GESTION TERCEROS",
    "GESTIONADO CODENSA",
    "PARA ASIGNACIÓN LOCAL NOVEDADES",
  ],
  "STORIA": [
    "ACTUALIZADA",
    "DEVUELTO CODENSA",
    "GESTIONADO CODENSA",
    "PARA CARGUE",
    "PENDIENTE",
    "PARA ASIGNACIÓN LOCAL STORIA",
  ],
  "HALLAZGOS": [
    "ASIGNACIÓN INCORRECTA",
    "CARGADA MERCURIO",
    "PARA CARGUE",
    "PARA COBRO",
    "PENDIENTE DE GESTIÓN",
    "PARA ASIGNACIÓN LOCAL HALLAZGOS",
  ],
  "INFORMATIVAS": [
    "ASIGNACIÓN INCORRECTA",
    "CARGADA MERCURIO",
    "PARA CARGUE",
    "PARA COBRO",
    "PENDIENTE DE GESTIÓN",
    "PARA ASIGNACIÓN LOCAL INFORMATIVAS",
  ],
};

//===================== dar casos=================================================================================
funcs.darCasos = async function (query, f1, f2, tipo, lastId, firstId) {
  const slice = tipo === "1" ? -1 : 0

  const casos = await casoDB.darCasos(query, lastId, firstId, f1, f2, slice);
  let result = []
  for (let i = 0; i < casos.length; i++) {
    let caso = JSON.parse(JSON.stringify(casos[i]))
    for (let i = 0; i < caso.atributosNuevos.length; i++) {
      caso[caso.atributosNuevos[i].nombre] = caso.atributosNuevos[i].valor
    }
    delete caso.atributosNuevos
    result.push(caso)
  }
  return result
}

funcs.darCasosDescargar = async function (query, f1, f2, tipo, lastId, firstId) {
  const slice = tipo === "1" ? -1 : 0

  const cuantos = await casoDB.contarCasos(query, lastId, firstId, f1, f2, slice);
  if (cuantos > 1000) {
    return false
  }
  const casos = await casoDB.darMilCasos(query, lastId, firstId, f1, f2, slice);

  let result = []
  for (let i = 0; i < casos.length; i++) {
    let caso = JSON.parse(JSON.stringify(casos[i]))
    for (let i = 0; i < caso.atributosNuevos.length; i++) {
      caso[caso.atributosNuevos[i].nombre] = caso.atributosNuevos[i].valor
    }
    delete caso.atributosNuevos
    result.push(caso)
  }
  return result
}

funcs.darCasosDescargarMil = async function (query, f1, f2, tipo, lastId, firstId) {
  const slice = tipo === "1" ? -1 : 0

  const casos = await casoDB.darMilCasos(query, lastId, firstId, f1, f2, slice);
  let result = []
  for (let i = 0; i < casos.length; i++) {
    let caso = JSON.parse(JSON.stringify(casos[i]))
    for (let i = 0; i < caso.atributosNuevos.length; i++) {
      caso[caso.atributosNuevos[i].nombre] = caso.atributosNuevos[i].valor
    }
    delete caso.atributosNuevos
    result.push(caso)
  }
  return result
}
funcs.darResumen = async function (query, f1, f2, tipo, modulo) {

  const estados = diccionarioEstadosPorModulo[modulo];
  const slice = tipo === "1" ? -1 : 0
  let ans = []
  let total = 0;
  for (let i = 0; i < estados.length; i++) {
    let cantidad = await casoDB.contarCasosResumen(query, f1, f2, slice, estados[i], modulo)
    total += cantidad
    ans.push({ Estado: estados[i], Cantidad: cantidad })
  }

  ans.push({ Estado: "Total", Cantidad: total })

  return ans
}
funcs.darAtributos = async function (modulo) {
  let atributos = [];
  atributos.unshift("idLote")
  for (let i = diccionarioAtributosPorModulo[modulo].length - 1; i >= 0; i--) {
    atributos.unshift(diccionarioAtributosPorModulo[modulo][i].nombreEnDB)
  }
  atributos.unshift("motivo")
  atributos.unshift("cambiosDeEstado")
  atributos.unshift("estado")
  atributos.unshift("ordenado")

  return atributos
}
//===================== Subida de un lote=================================================================================

funcs.crearCasosAnalisis = async function (req, idLote, cerrados) {
  let { lastRow,
    cells
  } = fileData(req.file);

  try {
    let loteDeCasos = [];
    const casosEnBD = await casoDB.darCasosSimple();
    let casosYaAgregados = {}
    const casosEnBDObj = arrayToObjectSimple(casosEnBD, "ordenado")
    const columnasEnArchivoDeAtributos = darColumnasEnArchivoDeAtributos(cells, "ANALISIS"); // Cuáles columnas del caso hay en el archivo
    const columnasEnLote = diccionarioAtributosPorModulo["ANALISIS"].filter(a => a.enLoteDeAsignacion); // Cuántas columnas debería haber.
    const revisionColumnas = revisarColumnas(columnasEnLote, columnasEnArchivoDeAtributos);
    if (!revisionColumnas.success) {
      return revisionColumnas;
    }
    for (let i = 2; i <= lastRow; i++) {
      if (!casosEnBDObj[cells["A" + i].v] // El caso no está en la base de datos
        && cells["L" + i] && (cells["L" + i].v + "").toUpperCase() === "COMSISTELCO" // El caso es de comsistelco 
        && !casosYaAgregados[cells["A" + i].v]) { // El caso no había aparecido ya en el archivo
        let nuevoCaso = {};
        nuevoCaso.ordenado = cells["A" + i].v + "";
        nuevoCaso.estado = "PARA ASIGNACIÓN LOCAL ANALISIS";
        nuevoCaso.motivo = "-";
        nuevoCaso.modulos = ["ANALISIS"];
        nuevoCaso.cambiosDeEstado = [];
        for (let ac of columnasEnArchivoDeAtributos) {
          nuevoCaso[ac.atributo] = cells[ac.columna + i] ? interpretar(cells[ac.columna + i].v, ac.atributo) : "-";
        }

        nuevoCaso.idLote = idLote;

        nuevoCaso.cambiosDeEstado.push({ nuevoEstado: "PARA ASIGNACIÓN LOCAL ANALISIS", fecha: nuevoCaso["asignacionAnalisis"] !== "" ? interpretar(nuevoCaso["asignacionAnalisis"], "asignacionAnalisis") : darFecha(), observacion: req.body.observacion })
        loteDeCasos.push(nuevoCaso);
        casosYaAgregados[cells["A" + i].v] = true
      }
    }
    try {
      await casoDB.guardarCasos(loteDeCasos);
      return { success: true, message: "Lote añadido", casosCerradosRepetidos: cerrados };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Ocurrió un error (2)" };
    }

  } catch (error) {
    console.error(error);
    return { success: false, message: "Ocurrió un error (1)" };
  }
}

funcs.crearCasosLiquidacion = async function (req, idLote, cerrados) {
  let { lastRow,
    cells
  } = fileData(req.file);

  try {
    let loteDeCasosNuevos = [];
    let loteDeCasosActualizar = [];
    const casosEnBD = await casoDB.darCasosSimple();
    let casosYaAgregados = {}
    const casosEnBDObj = arrayToObjectSimple(casosEnBD, "ordenado")
    const columnasEnArchivoDeAtributos = darColumnasEnArchivoDeAtributos(cells, "LIQUIDACION"); // Cuáles columnas del caso hay en el archivo
    const columnasEnLote = diccionarioAtributosPorModulo["LIQUIDACION"].filter(a => a.enLoteDeAsignacion); // Cuántas columnas debería haber.
    const revisionColumnas = revisarColumnas(columnasEnLote, columnasEnArchivoDeAtributos);

    if (!revisionColumnas.success) {
      return revisionColumnas;
    }

    for (let i = 2; i <= lastRow; i++) {
      if (!casosYaAgregados[cells["A" + i].v]) { // El caso no había aparecido ya en el archivo
        let nuevoCaso = {};
        nuevoCaso.estado = "PARA ASIGNACIÓN LOCAL LIQUIDACION";
        nuevoCaso.ordenado = cells["A" + i].v + "";
        for (let ac of columnasEnArchivoDeAtributos) {
          nuevoCaso[ac.atributo] = cells[ac.columna + i] ? interpretar(cells[ac.columna + i].v, ac.atributo) : "-";
        }

        nuevoCaso.idLote = idLote;

        if (!casosEnBDObj[cells["A" + i].v]) { // El caso no existe en la base de datos, es necesario inicializar el atributo "modulos".
          nuevoCaso.cambiosDeEstado = [{ nuevoEstado: "PARA ASIGNACIÓN LOCAL LIQUIDACION", fecha: nuevoCaso["asignacionLiquidacion"] !== "" ? nuevoCaso["asignacionLiquidacion"] : darFecha(), observacion: req.body.observacion }];
          nuevoCaso.modulos = ["LIQUIDACION"];
          loteDeCasosNuevos.push(nuevoCaso);
        } else { // El caso ya existe en la base de datos, es necesario actualizarlo
          nuevoCaso.nuevoCambioDeEstado = { nuevoEstado: "PARA ASIGNACIÓN LOCAL LIQUIDACION", fecha: nuevoCaso["asignacionLiquidacion"] !== "" ? interpretar(nuevoCaso["asignacionLiquidacion"], "asignacionLiquidacion") : darFecha(), observacion: req.body.observacion };
          loteDeCasosActualizar.push(nuevoCaso);
        }
        casosYaAgregados[cells["A" + i].v] = true
      }
    }
    try {
      await casoDB.guardarCasos(loteDeCasosNuevos);
      const resultadoAgregarANuevoModulo = await casoDB.incluirCasosEnNuevoModulo(loteDeCasosActualizar, "LIQUIDACION");
      return { success: true, message: "Lote añadido", casosCerradosRepetidos: cerrados, casosActualizados: resultadoAgregarANuevoModulo.casosActualizados };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Ocurrió un error (31)" };
    }

  } catch (error) {
    console.error(error);
    return { success: false, message: "Ocurrió un error (32)" };
  }
}

funcs.crearCasosModuloParametrizado = async function (req, idLote, cerrados, modulo) { // Para balance macro, novedades, storia, hallazgos e informativas
  let fileInfo;

  if (modulo === "NOVEDADES") {
    fileInfo = fileDataFromSheet(req.file, "Sheet1")
  } else {
    fileInfo = fileData(req.file)
  }

  const { lastRow,
    cells
  } = fileInfo;
  try {
    let loteDeCasosNuevos = [];
    let loteDeCasosActualizar = [];
    const casosEnBD = await casoDB.darCasosSimple();
    let casosYaAgregados = {}
    const casosEnBDObj = arrayToObjectSimple(casosEnBD, "ordenado")
    const columnasEnArchivoDeAtributos = darColumnasEnArchivoDeAtributos(cells, modulo); // Cuáles columnas del caso hay en el archivo
    const columnasEnLote = diccionarioAtributosPorModulo[modulo].filter(a => a.enLoteDeAsignacion); // Cuáles columnas debería haber.
    const revisionColumnas = revisarColumnas(columnasEnLote, columnasEnArchivoDeAtributos);
    const columnaOrdenadoPorModulo = {
      "BALANCE MACROMEDICION": "A",
      "NOVEDADES": "H",
      "STORIA": "E",
      "HALLAZGOS": "A",
      "INFORMATIVAS": "A",
    }
    const contratistasNovedades = [
      "INMEL INGENIERÍA S.A.S.",
      "INMEL INSPECCIONES C/MARCA",
      "INMEL INSPECCIONES CUNDINAMARCA",
      "MICOL INSPECCIONES C/MARCA",
      "MICOL INSPECIONES CUNDINAMARCA",
      "MONTAJES DE INGENIERÍA DE COLO",
    ]

    if (!revisionColumnas.success) {
      return revisionColumnas;
    }

    for (let i = 2; i <= lastRow; i++) {
      if (!casosYaAgregados[cells[columnaOrdenadoPorModulo[modulo] + i].v]) { // El caso no había aparecido ya en el archivo
        if (modulo !== "NOVEDADES" || contratistasNovedades.find(c => c === cells["A" + i].v)) { // Si es de novedades, debe ser de uno de los contratistas definidos
          let nuevoCaso = {};
          nuevoCaso.estado = "PARA ASIGNACIÓN LOCAL " + modulo;
          nuevoCaso.ordenado = cells[columnaOrdenadoPorModulo[modulo] + i].v + "";
          for (let ac of columnasEnArchivoDeAtributos) {
            nuevoCaso[ac.atributo] = cells[ac.columna + i] ? interpretar(cells[ac.columna + i].v, ac.atributo) : "-";
          }

          nuevoCaso.idLote = idLote;

          if (!casosEnBDObj[cells[columnaOrdenadoPorModulo[modulo] + i].v]) { // El caso no existe en la base de datos, es necesario inicializar el atributo "modulos".
            nuevoCaso.cambiosDeEstado = [{ nuevoEstado: "PARA ASIGNACIÓN " + modulo, fecha: darFecha(), observacion: req.body.observacion }];
            nuevoCaso.modulos = [modulo];
            loteDeCasosNuevos.push(nuevoCaso);
          } else { // El caso ya existe en la base de datos, es necesario actualizarlo
            nuevoCaso.nuevoCambioDeEstado = { nuevoEstado: "PARA ASIGNACIÓN " + modulo, fecha: darFecha(), observacion: req.body.observacion };
            loteDeCasosActualizar.push(nuevoCaso);
          }
          casosYaAgregados[cells[columnaOrdenadoPorModulo[modulo] + i].v + ""] = true
        }
      }
    }
    try {
      await casoDB.guardarCasos(loteDeCasosNuevos);
      const resultadoAgregarANuevoModulo = await casoDB.incluirCasosEnNuevoModulo(loteDeCasosActualizar, modulo);
      return { success: true, message: "Lote añadido", casosCerradosRepetidos: cerrados, casosActualizados: resultadoAgregarANuevoModulo.casosActualizados };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Ocurrió un error (35)" };
    }

  } catch (error) {
    console.error(error);
    return { success: false, message: "Ocurrió un error (36)" };
  }
}


funcs.crearLote = async function (file, req) {
  let { lastRow, cells
  } = fileData(file);
  let nuevoLote = {};
  nuevoLote.fechaSubido = darFecha();
  nuevoLote.casos = lastRow - 1;
  nuevoLote.URLArchivo = "https://storage.googleapis.com/intelligentimgbucket/SICA/" + file.originalname
  const resultadoLote = await loteDB.guardarLote(nuevoLote);
  if (resultadoLote.success) {
    await fileUpload.uploadToGcsSICA(req);
    return { idLote: resultadoLote.idLote, url: nuevoLote.URLArchivo }
  }
  else return false;
}
funcs.borrarLote = async function (idActividad, idLote) {
  const lote = await loteDB.darLote(idLote)
  if (lote) {
    try {
      const r1 = await loteDB.borrarLote(idLote)
      const r2 = await actividadDB.borrarActividad(idActividad)
      const r3 = await await casoDB.borrarLote(idLote)
      const r4 = await archivoDB.borrar(lote.URLArchivo.split("https://storage.googleapis.com/intelligentimgbucket/SICA/")[1])

      if (r1.success
        && r2.success
        && r3.success
        && r4.success) {
        return { success: true, message: "Actividad borrada" }
      }

    } catch (error) {
      console.error(error);
      return { success: false, message: "Ocurrió un error (17)" }

    }
  } else {
    return { success: false, message: "No se encontró ese lote" }//No debe pasar nunca
  }

}

/**
 * Devuelve los ordenados de los casos contenidos en un archivo que aparecen como cerrados
 * en la base de datos.
 */
funcs.darCasosCerradosRepetidos = async function (file, modulo) {
  let fileInfo;

  if (modulo === "NOVEDADES") {
    fileInfo = fileDataFromSheet(file, "Sheet1")
  } else {
    fileInfo = fileData(file)
  }

  const { lastRow,
    cells
  } = fileInfo;

  const casosCerrados = await casoDB.darCasosCerrados();
  const columnaOrdenadoPorModulo = {
    "ANALISIS": "A",
    "LIQUIDACION": "A",
    "BALANCE MACROMEDICION": "A",
    "NOVEDADES": "H",
    "STORIA": "E",
    "HALLAZGOS": "A",
    "INFORMATIVAS": "A",
  }
  let ordenadosExistentes = arrayToObjectSimple(casosCerrados, "ordenado");
  let casosCerradosRepetidos = [];
  for (let i = 2; i <= lastRow; i++) {

    if (ordenadosExistentes[cells[columnaOrdenadoPorModulo[modulo] + i].v]) {
      casosCerradosRepetidos.push(ordenadosExistentes[cells[columnaOrdenadoPorModulo[modulo] + i].v])
    }

  }
  return casosCerradosRepetidos;
}
funcs.hayCasosIncorrectos = async function (file, modulo) {
  let fileInfo;

  if (modulo === "NOVEDADES") {
    fileInfo = fileDataFromSheet(file, "Sheet1")
  } else {
    fileInfo = fileData(file)
  }

  const { lastRow,
    cells
  } = fileInfo;

  uploadedFile = file.buffer;
  workbook = xlsx.read(uploadedFile, { type: "buffer" });
  const columnaOrdenadoPorModulo = {
    "ANALISIS": "A",
    "LIQUIDACION": "A",
    "BALANCE MACROMEDICION": "A",
    "NOVEDADES": "H",
    "STORIA": "E",
    "HALLAZGOS": "A",
    "INFORMATIVAS": "A",
  }
  const casosIncorrectos = await casoDB.darCasosIncorrectos();
  const ordenadosIncorrectos = arrayToObjectSimple(casosIncorrectos, "ordenado");
  for (let i = 2; i <= lastRow; i++) {
    if (ordenadosIncorrectos[cells[columnaOrdenadoPorModulo[modulo] + i].v]) {
      return cells[columnaOrdenadoPorModulo[modulo] + i].v
    }

  }
  return false;
}
//======================================================================================
//=======Actividades====================================================================
funcs.nuevaActividad = async function (actividad, file) {

  actividad.fecha = darFechaCompleta();
  await actividadDB.guardarActividad(actividad);

  // Enviar correo
  let { emailjsUserId, emailjsTemplateId, emailjsServiceId } = config.sicaMail;
  let { usuario, observacion, concepto, fecha } = actividad
  const mail = "af.olivares10@gmail.com"
  let data = {
    service_id: emailjsServiceId,
    template_id: emailjsTemplateId,
    user_id: emailjsUserId,
    template_params: { user: usuario, observation: observacion, concept: concepto, date: fecha, mail }
  };
  fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    contentType: 'application/json'
  }).then((res) => {
    console.log(res);
    console.log("Mensaje enviado!");

  }).catch((error) => {
    console.error(error);
  });
}
funcs.darActividades = async function (firstId, lastId) {
  let actividadesPrev = await actividadDB.darActividades(firstId, lastId);
  let padresPrev = actividadesPrev.filter(a => a.profundidad === 0)
  let padres = JSON.parse(JSON.stringify(padresPrev)) //NPI pq putas
  let actividades = JSON.parse(JSON.stringify(actividadesPrev)) //NPI pq putas

  for (let i = 0; i < padres.length; i++) {
    padres[i].hijitas = [];
    padres[i].hijitas = actividades.filter(a => a.idActividadPadre === padres[i]._id).sort((r1, r2) => {
      return (new Date(r1.fecha).getTime() - new Date(r2.fecha).getTime())
    })
  }
  return padres;
}



//======================================================================================================

//================Cambio manual a estados======================================================================================
funcs.cambiarEstadosACasos = async function (data) {
  let actividad = {}
  actividad.observacion = data.observacion;
  actividad.concepto = "Cambio manual a estado de casos";
  actividad.profundidad = 0;
  actividad.usuario = data.usuario;
  actividad.fecha = darFechaCompleta();
  let batch = []
  let cambiosCasos = []
  let batchDeIds = []
  for (let ordenado of data.casos) {
    batch.push({ ordenado, estado: data.estado })
    batchDeIds.push(ordenado)
    cambiosCasos.push({ caso: ordenado, nuevoEstado: data.estado })
  }
  actividad.cambiosCasos = cambiosCasos;
  const restantes = await darCasosRestantes(batchDeIds)
  const dbResult = await casoDB.actualizarCasos(batch, data.observacion, darFecha(), false, data.modulo)
  dbResult.casosRestantes = restantes;
  if (dbResult.success) {
    await actividadDB.guardarActividad(actividad);
  }
  return dbResult
}

async function darCasosRestantes(batch) {

  const casosEnDB = JSON.parse(JSON.stringify(await casoDB.darCasosSimple()));
  const casosEnDBOBJ = arrayToObjectSimple(casosEnDB, "ordenado")
  let restantes = []
  for (let i = 0; i < batch.length; i++) {
    if (!casosEnDBOBJ[batch[i]]) {
      restantes.push(batch[i])
    }
  }
  return restantes

}
//==============Gestioon terceros============================================
funcs.subirGestionTercerosAnalisis = async function (req) {
  let { lastRow,
    cells
  } = fileData(req.file);
  const columnas = { ordenado: "B", estado: "E", motivo: "F" }
  let batch = []
  let batchDeIds = []
  for (let i = 2; i <= lastRow; i++) {
    batch.push({
      ordenado: (cells[columnas.ordenado + i].v + "").trim(),
      estado: cells[columnas.estado + i].v.trim(),
      motivo: cells[columnas.motivo + i].v.trim()
    })
    batchDeIds.push((cells[columnas.ordenado + i].v + "").trim())
  }
  const restantes = await darCasosRestantes(batchDeIds)
  const result = await casoDB.actualizarCasos(batch, req.body.observacion, darFecha(), false, "ANALISIS")
  result.casosRestantes = restantes
  if (result.success) {
    result.URLArchivo = await fileUpload.uploadToGcsSICA(req)
  }
  return result

}

funcs.subirGestionTercerosLiquidacion = async function (req) {
  let { lastRow,
    cells
  } = fileData(req.file);
  const columnas = { ordenado: "B", estado: "E", motivo: "F" }
  let batch = []
  let batchDeIds = []
  for (let i = 2; i <= lastRow; i++) {
    batch.push({
      ordenado: (cells[columnas.ordenado + i].v + "").trim(),
      estado: cells[columnas.estado + i].v.trim(),
      motivo: cells[columnas.motivo + i].v.trim()
    })
    batchDeIds.push((cells[columnas.ordenado + i].v + "").trim())
  }
  const restantes = await darCasosRestantes(batchDeIds)
  const result = await casoDB.actualizarCasos(batch, req.body.observacion, darFecha(), false, "LIQUIDACION")
  result.casosRestantes = restantes
  if (result.success) {
    result.URLArchivo = await fileUpload.uploadToGcsSICA(req)
  }
  return result

}

funcs.subirGestionTercerosNovedades = async function (req) {
  let { lastRow,
    cells
  } = fileData(req.file);
  const columnas = { ordenado: "B", estado: "E", motivo: "F" }
  let batch = []
  let batchDeIds = []
  for (let i = 2; i <= lastRow; i++) {
    batch.push({
      ordenado: (cells[columnas.ordenado + i].v + "").trim(),
      estado: cells[columnas.estado + i].v.trim(),
      motivo: cells[columnas.motivo + i].v.trim()
    })
    batchDeIds.push((cells[columnas.ordenado + i].v + "").trim())
  }
  const restantes = await darCasosRestantes(batchDeIds)
  const result = await casoDB.actualizarCasos(batch, req.body.observacion, darFecha(), false, "NOVEDADES")
  result.casosRestantes = restantes
  if (result.success) {
    result.URLArchivo = await fileUpload.uploadToGcsSICA(req)
  }
  return result

}

//================Solicitar cargue de ODT======================================================================================

funcs.subirRemitirOdt = async function (req) {
  const columnas =
    { ordenado: "A", observacionSinAccion: "B", observacioConAccion: "O" };

  const fileDataCollection = multiFileData(req.file)
  let batch = []
  let observaciones = {}
  let { lastRow,
    cells
  } = fileDataCollection[0];
  let batchDeIds = []
  for (let i = 2; i <= lastRow; i++) {
    batchDeIds.push((cells[columnas.ordenado + i].v + "").trim())
    batch.push({
      ordenado: (cells[columnas.ordenado + i].v + "").trim(),
      estado: "REMITIDO PARA CARGUE ODT"
    })
    observaciones[(cells[columnas.ordenado + i].v + "").trim()] = cells[columnas.observacionSinAccion + i].v.trim() + " (sin acciones)"
  }

  lastRow = fileDataCollection[1].lastRow;
  cells = fileDataCollection[1].cells;

  for (let i = 1; i <= lastRow; i++) {
    batchDeIds.push((cells[columnas.ordenado + i].v + "").trim())
    batch.push({
      ordenado: (cells[columnas.ordenado + i].v + "").trim(),
      estado: "REMITIDO PARA CARGUE ODT"
    })
    observaciones[(cells[columnas.ordenado + i].v + "").trim()] = cells[columnas.observacioConAccion + i].v.trim() + " (con acciones)"
  }
  try {
    const restantes = await darCasosRestantes(batchDeIds);
    const result = await casoDB.actualizarCasos(batch, "", darFecha(), observaciones, "ANALISIS")
    result.casosRestantes = restantes;
    if (result.success) {
      result.URLArchivo = await fileUpload.uploadToGcsSICA(req)
    }
    return result
  } catch (error) {
    return { success: false, message: "Ocurrió un error (12)" }

  }
}
//================Finalización de la inspección de un lote======================================================================================
funcs.subirFinalizacionInspeccion = async function (req) {
  const columnas =
    { ordenado: "A", observacion: "B" };

  const fileDataCollection = multiFileData(req.file)
  let batch = []
  let observaciones = {}
  let batchDeIds = []
  for (let fileD of fileDataCollection) {
    let { lastRow,
      cells
    } = fileD;
    for (let i = 2; i <= lastRow; i++) {
      batchDeIds.push((cells[columnas.ordenado + i].v + "").trim())
      batch.push({
        ordenado: (cells[columnas.ordenado + i].v + "").trim(),
        estado: "CERRADO"
      })
      observaciones[(cells[columnas.ordenado + i].v + "").trim()] = cells[columnas.observacion + i].v.trim()
    }
  }
  const restantes = await darCasosRestantes(batchDeIds);
  const result = await casoDB.actualizarCasos(batch, "", darFecha(), observaciones, "ANALISIS")
  result.casosRestantes = restantes
  if (result.success) {
    result.URLArchivo = await fileUpload.uploadToGcsSICA(req)
  }
  return result
}


funcs.subirConsolidadoAnalisis = async function (req) {

  const columnas = [{ ordenado: "A", estado: "B", MOTIVO: "C" }]
  return subirArchivoModificadorParametrizado(req, columnas, "ANALISIS")

}
//==============Reportes de liquidacion============================================
funcs.subirReportesDeLiquidacion = async function (req) {

  const columnas = [{ ordenado: "D", estado: "B" }]
  return subirArchivoModificadorParametrizado(req, columnas, "LIQUIDACION")

}

//============== Consolidado balance ============================================
funcs.subirConsolidadoBalance = async function (req) {
  const columnas = [
    { ordenado: "B", estado: "A" },
    { ordenado: "A", estado: "F" },
  ]
  return subirArchivoModificadorParametrizado(req, columnas, "BALANCE MACROMEDICION")
}

//============== Consolidado novedades ============================================
funcs.subirConsolidadoNovedades = async function (req) {
  const columnas = [
    { ordenado: "A", estado: "B", motivo: "C" },
    { estado: "A", motivo: "B", ordenado: "E" },
    { ordenado: "A", estado: "B", motivo: "C" },
  ]
  return subirArchivoModificadorParametrizado(req, columnas, "NOVEDADES")
}

//============== Consolidado storia ============================================
funcs.subirConsolidadoStoria = async function (req) {
  const columnas = [
    { ordenado: "D", estado: "A" },
  ]
  return subirArchivoModificadorParametrizado(req, columnas, "STORIA")
}

//============== Archivo genérico ============================================
/**
 * Modifica los campos de los casos contenidos en un archivo con múltiples hojas
 * de acuerdo al contenido del archivo, a un objeto columnas que define la posición del ordenado (y del estado)
 * en cada hoja y a los atributos definidos para los casos de cada módulo.
 */
async function subirArchivoModificadorParametrizado(req, columnas, modulo) {
  const dataSet = multiFileData(req.file);

  let batchDeCasos = [];
  let batchDeIds = [];
  let casosYaAgregados = {}
  for (let hojaActual = 0; hojaActual < dataSet.length; hojaActual++) {
    let { cells, lastRow } = dataSet[hojaActual];
    let columnasEnArchivoDeAtributos = darColumnasEnArchivoDeAtributos(cells, modulo); // Cuáles columnas del caso hay en el archivo
    for (let i = 2; i <= lastRow; i++) {
      if (!casosYaAgregados[cells[columnas[hojaActual].ordenado + i].v]) { // El caso no había aparecido ya en el archivo
        let nuevoCaso = {};
        if (columnas[hojaActual].estado) {
          nuevoCaso.estado = cells[columnas[hojaActual].estado + i].v + "";
        }
        if (columnas[hojaActual].motivo) {
          nuevoCaso.motivo = cells[columnas[hojaActual].motivo + i].v + "";
        }
        nuevoCaso.ordenado = cells[columnas[hojaActual].ordenado + i].v + "";
        for (let ac of columnasEnArchivoDeAtributos) {
          nuevoCaso[ac.atributo] = cells[ac.columna + i] ? interpretar(cells[ac.columna + i].v, ac.atributo) : "-";
        }

        batchDeCasos.push(nuevoCaso);
        casosYaAgregados[cells[columnas[hojaActual].ordenado + i].v] = true
        batchDeIds.push((cells[columnas[hojaActual].ordenado + i].v + "").trim())
      }
    }
  }
  try {
    const restantes = await darCasosRestantes(batchDeIds)
    const result = await casoDB.actualizarCasos(batchDeCasos, req.body.observacion, darFecha(), false, modulo)
    result.casosRestantes = restantes
    if (result.success) {
      result.URLArchivo = await fileUpload.uploadToGcsSICA(req)
    }
    return result
  } catch (e) {
    console.error(e);
    return { success: false, message: "Ocurrió un error (40)" };
  }
}

//================Solo subir un archivo======================================================================================

funcs.subirOtro = async function (req) {
  try {
    const URLArchivo = await fileUpload.uploadToGcsSICA(req);
    return { success: true, URLArchivo, message: "Archivo subido exitosamente" }
  }
  catch (error) {
    console.error(error);
    return { success: false, message: "Ocurrió un error (11)" }
  }
}

//================Nuevos atributos a casos con cluster======================================================================================
function formatString(accentedSnakeCase) {//Quita tildes y pasa de snakecase a camel case
  let s = accentedSnakeCase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  let y = s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
  return y.replace('-', '')
    .replace('_', '');
}
funcs.nuevosAtributosACasos = async function (req) {

  const { lastRow, cells } = fileData(req.file)
  const columnas = { ordenado: "A" };
  const lastColumn = getCellColumnNumber(cells["!ref"].split(":")[1])
  let atributos = []
  let nombresAtributos = []
  for (let i = 2; i <= lastColumn; i++) {// Desde 2 para ignorar el ordenado
    if (i <= 26) {
      let columna = String.fromCharCode(i + 64);
      if (cells[columna + "1"]) {
        atributos.push({ nombre: cells[columna + "1"].v.trim(), columna })
        nombresAtributos.push(cells[columna + "1"].v.trim())
      }
    } else {
      base = Math.floor(i / 26)
      residuo = i - base * 26
      let myColumna = String.fromCharCode(base + 64) + String.fromCharCode(residuo + 64);
      if (cells[myColumna + "1"]) {
        atributos.push({ nombre: cells[myColumna + "1"].v.trim(), columna: myColumna })
        nombresAtributos.push(cells[myColumna + "1"].v.trim())
      }
    }

  }
  let batch = []
  let atributosNuevosPorCaso = {}
  let atributosNuevos = {}
  let batchDeIds = []
  const casosEnBD = await casoDB.darCasosSimple();
  const casosEnBDObj = arrayToObjectSimple(casosEnBD);

  for (let i = 2; i <= lastRow; i++) {
    let caso = {}
    caso.ordenado = (cells[columnas.ordenado + i].v + "").trim()
    batchDeIds.push(caso.ordenado)
    if (casosEnBDObj[caso.ordenado]) {
      for (let j = 0; j < atributos.length; j++) {
        let normal = atributosCaso.find(ac => ac.atributo === formatString(atributos[j].nombre));
        let atributo = atributos[j]
        if (normal || atributos[j].nombre.toLowerCase() === "estado" || atributos[j].nombre.toLowerCase() === "motivo") {//El atributo es de los definidos desde el inicio
          caso[formatString(atributo.nombre)] = cells[atributo.columna + i + ""] ? (cells[atributo.columna + i + ""].v + "").trim() : ""
        }
        else {//El atributo es de los nuevos
          atributosNuevos[formatString(atributo.nombre)] = true //Guardar nuevo atributo
          if (!atributosNuevosPorCaso[caso.ordenado]) {
            atributosNuevosPorCaso[caso.ordenado] = []
          }
          if (cells[atributo.columna + i + ""]) {
            atributosNuevosPorCaso[caso.ordenado].push({ nombre: formatString(atributo.nombre), valor: (cells[atributo.columna + i + ""].v + "").trim() })
          } else {
            atributosNuevosPorCaso[caso.ordenado].push({ nombre: formatString(atributo.nombre), valor: "" })
          }
        }
      }
      batch.push(caso)
    }
  }
  try {
    const resultadoAN = await atributoNuevoDB.guardarAtributosNuevos(atributosNuevos);
    if (resultadoAN.success) {
      const restantes = await darCasosRestantes(batchDeIds)
      let result = await casoDB.actualizarCasosCluster(batch, atributosNuevosPorCaso, nombresAtributos, darFecha())
      if (result.success) {
        result.casosRestantes = restantes
        result.URLArchivo = await fileUpload.uploadToGcsSICA(req)

      }

      return result
    }
    return { success: false, message: "Ocurrió un error (14)" }

  } catch (error) {
    console.error(error);
    return { success: false, message: "Ocurrió un error (13)" }
  }
}
//================Borrar nuevosAtributo======================================================================================
funcs.borrarAtributo = async function (nombre) {
  try {
    return await atributoNuevoDB.borrarAtributo(nombre)
  }
  catch (error) {
    console.error(error);
    return { success: false, message: "Ocurrió un error (17)" }
  }
}

funcs.atributosCaso = atributosCaso
funcs.diccionarioAtributosPorModulo = diccionarioAtributosPorModulo
funcs.diccionarioEstadosPorModulo = diccionarioEstadosPorModulo

module.exports = funcs