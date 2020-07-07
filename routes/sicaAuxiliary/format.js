const xlsx = require("xlsx");
const logic = require("./logicFuncs")



let funcs = {}
function getCellNumber(cell){
  for(let i = 0; i < cell.length; i++){
    if(Number.parseInt(cell[i])){
      return Number.parseInt(cell.substring(i));
    }
  }
}

function fileData(file){
  uploadedFile = file.buffer;
  workbook = xlsx.read(uploadedFile, {type: "buffer"});
  range  = workbook.Sheets[Object.keys(workbook.Sheets)[0] ]["!ref"];
  const cells = workbook.Sheets[Object.keys(workbook.Sheets)[0]];
  const cellsKeys = Object.keys(cells);
  const lastRow = getLastRow(cellsKeys)
  return{
    lastRow,
    cells
  }
}
function multiFileData(file){
  uploadedFile = file.buffer;
  workbook = xlsx.read(uploadedFile, {type: "buffer"});
  range  = workbook.Sheets[Object.keys(workbook.Sheets)[0] ]["!ref"];
  let cellsCollection = [];
  for(let cellKey in workbook.Sheets){
    cellsCollection.push({cells:workbook.Sheets[cellKey], lastRow:getLastRow( Object.keys(workbook.Sheets[cellKey])) })
  }
  return cellsCollection;
}

function getLastRow(cellsKeys){
  for(let i = cellsKeys.length -1; i>=0; i--){
    if(cellsKeys[i].charAt(0)!=="!"){
      return getCellNumber(cellsKeys[i])
    }
  }
}


funcs.validarGestionTerceros = function(file){
  let {lastRow,
    cells
  } = fileData(file);

  if(lastRow < 3002){
    const atributosCaso = [
      {columna:"B",nombre:"ORDEN"},
      {columna:"E",nombre:"ESTADO"},
      {columna:"F",nombre:"MOTIVO"},
    ];
    for(let ac of atributosCaso){
      if((cells[ac.columna+1].v+"").toUpperCase() !== ac.nombre.toUpperCase()){
        return {valido:false, mensaje:"Formato inválido"}
      }
    }
    return {valido:true, mensaje:""}
  }
  return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"} ;

}

funcs.validarConsolidadoAnalisis = function(file){
  let {lastRow,
    cells
  } = fileData(file);

  if(lastRow < 3002){
    const atributosCaso = [
      {columna:"A",nombre:"NÚMERO_DE_"},
      {columna:"B",nombre:"ESTADO"},
      {columna:"C",nombre:"MOTIVO"},
    ];
    for(let ac of atributosCaso){
      if((cells[ac.columna+1].v+"").toUpperCase() !== ac.nombre.toUpperCase()){

        return {valido:false, mensaje:"Formato inválido"}
      }
    }
    return {valido:true, mensaje:""}
  }
  return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"} ;

}

funcs.validarRemitirOdt = function(file){
  const atributos = [
    {columna:"A",nombre:"ORDEN"},
    {columna:"B",nombre:"OBSERVACION"}
    ];
  const {lastRow,
    cells
  } = multiFileData(file)[0]

  if(lastRow < 3002){
    for(let ac of atributos){
      if((cells[ac.columna+1].v+"").toUpperCase() !== ac.nombre.toUpperCase()){
        return {valido:false, mensaje:"Formato inválido"}
      }
    }
    if( multiFileData(file)[1]){
      return {valido:true, mensaje:""}
    }else{
      return {valido:false, mensaje:"Formato inválido"}
    }
  }
  return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"} ;

}

funcs.validarFinalizacionInspecciones = function(file){
  const atributos = [
    {columna:"A",nombre:"ORDEN"},
    {columna:"B",nombre:"OBSERVACION"}
  ];

  const fileDataCollection = multiFileData(file)
  for(let fileD of fileDataCollection){
    let {lastRow,
      cells
    } = fileD;

    if(lastRow < 3002){
      for(let ac of atributos){
        if((cells[ac.columna+1].v+"").toUpperCase() !== ac.nombre.toUpperCase()){
          return {valido:false, mensaje:`Se esperaba una columna ${ac.nombre} pero se obtuvo una ${(cells[ac.columna+1].v+"").toUpperCase()}`}
        }
      }
    }else {
      return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"} ;
    }
  }
  return {valido:true, mensaje:""}

}

funcs.validarReportesDeLiquidacion = function(file){
  
  let {lastRow,
    cells
  } = fileData(file);

  if(lastRow < 3002){ 
    const encabezado = "EXPEDIENTE	ESTADO	MOTIVO	NÚMERO_DE_	NRO_CUENTA	SERVICIO_ELÉCTRICO	DES_RESULTADO	FECHA_DE_OPERACIÓN_EN_TERRENO	contrato	GRUPO	HALLAZGOS_AGRUPADOS_last	OBS_INSP	FECHA ANALISIS	OBSERVACION  ANALISIS	 WORKERTAG 	FECHA ASIGNA	ASSIGNMENT	FACTOR_ENCONTRADO	FECHA DE CARGUE EPICA	Obs_liquidación	 NOVCOM 	DOLO	ANOMALIA TERRENO	ANOMALIA LAB	Inicio periodo permanencia	PERMANENCIA	MÉTODO OBTENCIÓN DE CARGA	kWh TOTALES	 $-Kwh-Recuperación 	 $-kWh-Contribución 	 RECUPERACIÓN DE ENERGÍA 	 CONTRIBUCION POR REINTEGROS 	SUBSIDIO	 $CNR 	 MOTIVO TIPO M 	 C/m 	FACTURA	F2";
    const columnas = encabezado.split("\t");
    let cellContent = "";
    const cellsIds = Object.keys(cells);
    for(let i = 1; i < cellsIds.length; i++){ // Empieza en 1 pues en la posición 0 está !ref
      cellContent = cellsIds[i].split(/[A-Z]+/);
      if(cellContent[1]+"" === "1"){ // La primera fila.
        if((cells[cellsIds[i]].v + "").trim() !== columnas[i-1].trim()){
          return {valido:false, mensaje:"Formato inválido"}
        }
      }
      else{
        break;
      }
    }

    return {valido:true, mensaje:""}
  }
  return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"} ;
}

funcs.validarConsolidadoBalance = function(file){
  
  const dataSet = multiFileData(file);
  const encabezados = ["ESTADO	OT	ID_COD_TRA	FECHA_RECPECION	FECHA_ANALISIS	REQUIERE_MANTENIMIENTO	REQUIERE_VCT	LECTURA_REQUIERE_INTERVENTORIA	REQUIERE_NOVEDAD	ACTUALIZAR_LECTURA	ACTUALIZAR_VCT	CONFIRMADO	OBSERVACION_ANALISIS	WORKETAG",
  "OT	ID_COD_TRA	FECHA_RECPECION	FECHA_SEGUIMIENTO	ACCION	ESTADO"]
  
  for (let j = 0; j <  dataSet.length; j++){
    let {lastRow,cells} = dataSet[j];
    if(lastRow < 3002){ 
      const columnas = encabezados[j].split("\t");
      let cellContent = "";
      const cellsIds = Object.keys(cells);
      for(let i = 1; i < cellsIds.length; i++){ // Empieza en 1 pues en la posición 0 está !ref
        cellContent = cellsIds[i].split(/[A-Z]+/);
        if(cellContent[1]+"" === "1"){ // La primera fila.
          if((cells[cellsIds[i]].v + "").trim() !== columnas[i-1].trim()){
            return {valido:false, mensaje:"Formato inválido"}
          }
        }
        else{
          break;
        }
      }
  
      return {valido:true, mensaje:""}
    }
    return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"};
  }
}

funcs.validarConsolidadoNovedades = function(file){
  
  const dataSet = multiFileData(file);
  const encabezados = ["ORDEN	ESTADO	MOTIVO	FECHA	FechaOperación	ORDEN	SERVICIO	ESTADO_orden	FECHA DE ASIG	Contratista	Causal Resultado	Código Marca_ret	Marca Medidor_ret	Código Modelo_ret	Modelo Medidor_ret	Número Medidor_ret	LECTURA_ACTIVA_FP	LECTURA_REACTIVA_FP	Código Marca	Marca Medidor	Código Modelo	Modelo Medidor	Número Medidor	LECTURA	LECTURA REAC	WORKERTAG	OBSERVACIÓN_NOVEDAD	N_NOVEDAD	ESTADO_DEL_COMPONENTE	UBICACIÓN_ACTUAL",
"ESTADO	MOTIVO	FECHA	FechaOperación	ORDEN	SERVICIO	ESTADO_orden	FECHA DE ASIG	Contratista	Causal Resultado	Código Marca_ret	Marca Medidor_ret	Código Modelo_ret	Modelo Medidor_ret	Número Medidor_ret	LECTURA_ACTIVA_FP	LECTURA_REACTIVA_FP	Código Marca	Marca Medidor	Código Modelo	Modelo Medidor	Número Medidor	LECTURA	LECTURA REAC	WORKERTAG	OBSERVACIÓN_NOVEDAD	N_NOVEDAD	ESTADO_DEL_COMPONENTE	UBICACIÓN_ACTUAL",
"ORDEN	ESTADO	MOTIVO	FECHA	FechaOperación	ORDEN	SERVICIO	ESTADO_orden	FECHA DE ASIG	Contratista	Causal Resultado	Código Marca_ret	Marca Medidor_ret	Código Modelo_ret	Modelo Medidor_ret	Número Medidor_ret	LECTURA_ACTIVA_FP	LECTURA_REACTIVA_FP	Código Marca	Marca Medidor	Código Modelo	Modelo Medidor	Número Medidor	LECTURA	LECTURA REAC	WORKERTAG	OBSERVACIÓN_NOVEDAD	N_NOVEDAD	ESTADO_DEL_COMPONENTE	UBICACIÓN_ACTUAL",
 ]
  
  for (let j = 0; j <  dataSet.length; j++){
    let {lastRow,cells} = dataSet[j];
    if(lastRow < 3002){ 
      const columnas = encabezados[j].split("\t");
      let cellContent = "";
      const cellsIds = Object.keys(cells);
      for(let i = 1; i < cellsIds.length; i++){ // Empieza en 1 pues en la posición 0 está !ref
        cellContent = cellsIds[i].split(/[A-Z]+/);
        if(cellContent[1]+"" === "1"){ // La primera fila.
          if((cells[cellsIds[i]].v + "").trim() !== columnas[i-1].trim()){
            return {valido:false, mensaje:"Formato inválido"}
          }
        }
        else{
          break;
        }
      }
  
      return {valido:true, mensaje:""}
    }
    return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"};
  }
}

funcs.validarConsolidadoStoria = function(file){
  
  const dataSet = multiFileData(file);
  const encabezados = ["ESTADO	FECHA GESTIÓN	HOJA_VIDA	NO_ORDEN	NUM_CLI	SERVICIO	FECHA	NOVEDADES	DESC_MUN	DESC_MUN_COD	DIRECCION	GEO_X_mean	GEO_Y_mean	TARIFA	NIVEL	TENSION	FACTOR	DES_FASE	MEDIDOR	MARCA	MOD_ACT	des_modelo	ANO_FABRICACION	AFORO_sum	NOMBRE_CLI	Tipo_Medida	CCAL	FCAL	LAB	Ip	RTU",
 ]
  
  for (let j = 0; j <  dataSet.length; j++){
    let {lastRow,cells} = dataSet[j];
    if(lastRow < 3002){ 
      const columnas = encabezados[j].split("\t");
      let cellContent = "";
      const cellsIds = Object.keys(cells);
      for(let i = 1; i < cellsIds.length; i++){ // Empieza en 1 pues en la posición 0 está !ref
        cellContent = cellsIds[i].split(/[A-Z]+/);
        if(cellContent[1]+"" === "1"){ // La primera fila.
          if((cells[cellsIds[i]].v + "").trim() !== columnas[i-1].trim()){
            return {valido:false, mensaje:"Formato inválido"}
          }
        }
        else{
          break;
        }
      }
  
      return {valido:true, mensaje:""}
    }
    return {valido:false, mensaje:"No puede exceder 3000 casos por archivo"};
  }
}

module.exports = funcs
