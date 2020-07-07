const mongoose = require("mongoose"); // for working w/ our database
const CasoSchema       = require("../../../models/sica/caso");
const Caso = mongoose.model("Caso", CasoSchema);
const loteDB = require("./lote")
const ObjectId = require('mongodb').ObjectID;

let casoDB = {};

casoDB.guardarCasos = function (loteDeCasos){

  return new Promise(function(resolve,reject){
    Caso.insertMany(loteDeCasos,function(err){
      if (err) {
        reject(err);
      }
      else{
        resolve({success:true});
      }
    })

  })
}
casoDB.borrarLote = function (idLote){
  return new Promise(function (resolve,reject){
    Caso.remove({idLote},function(err, casos){
      if(err){
        reject(err);
      }
      else{
        resolve({success:true});
      }
    });
  })
}
casoDB.darCasos = function (query,last_id,first_id,f1,f2,slice){
  return new Promise(function (resolve,reject){
    if(last_id){
      query['_id']={$gt:new ObjectId(last_id)}
    }else if(first_id){
      query['_id']={$lt:new ObjectId(first_id)}
    }else{
      query['_id']={$gt:new ObjectId("000000000000000000000000")}
    }
    if(query.idLote){
      query.idLote = new ObjectId(query.idLote)
    }
    const fecha1 = new Date(f1);
    const fecha2 = new Date(f2);
    query.fecha = {"$gte": fecha1, "$lte": fecha2}
    let y = Caso.aggregate( [
      {
        $addFields: {
          cambio: {
            $arrayElemAt: [ "$cambiosDeEstado", slice ]
          }
        }
      },
      {
        $addFields: {
          fecha: {
            $dateFromString: {
              dateString: "$cambio.fecha"
            }
          }
        }
      },

      {
        $match: query
      },
      {
        $limit:50
      }
    ], function(err,y){
      if (err){
        reject(err)
      }
      else{
        resolve(y)
      }
    })
  })
}

casoDB.contarCasos = function (query,last_id,first_id,f1,f2,slice){
  return new Promise(function (resolve,reject){
    if(last_id){
      query['_id']={$gt:new ObjectId(last_id)}
    }else if(first_id){
      query['_id']={$lt:new ObjectId(first_id)}
    }else{
      query['_id']={$gt:new ObjectId("000000000000000000000000")}
    }
    const fecha1 = new Date(f1);
    const fecha2 = new Date(f2);
    query.fecha = {"$gte": fecha1, "$lte": fecha2}
    let y = Caso.aggregate( [
      {
        $addFields: {
          cambio: {
            $arrayElemAt: [ "$cambiosDeEstado", slice ]
          }
        }
      },
      {
        $addFields: {
          fecha: {
            $dateFromString: {
              dateString: "$cambio.fecha"
            }
          }
        }
      },

      {
        $match: query
      },
      {
        $count:"length"
      }
    ], function(err,y){
      if (err){
        reject(err)
      }
      else{
        if(y[0]){
          resolve(y[0].length)
        }else{
          resolve(0)
        }
      }
    })
  })
}
casoDB.darMilCasos = function (query,last_id,first_id,f1,f2,slice){
  return new Promise(function (resolve,reject){
    if(last_id){
      query['_id']={$gt:new ObjectId(last_id)}
    }else if(first_id){
      query['_id']={$lt:new ObjectId(first_id)}
    }else{
      query['_id']={$gt:new ObjectId("000000000000000000000000")}
    }
    const fecha1 = new Date(f1);
    const fecha2 = new Date(f2);
    query.fecha = {"$gte": fecha1, "$lte": fecha2}
    let y = Caso.aggregate( [
      {
        $addFields: {
          cambio: {
            $arrayElemAt: [ "$cambiosDeEstado", slice ]
          }
        }
      },
      {
        $addFields: {
          fecha: {
            $dateFromString: {
              dateString: "$cambio.fecha"
            }
          }
        }
      },

      {
        $match: query
      },
      {
        $limit:1000
      }
    ], function(err,y){
      if (err){
        reject(err)
      }
      else{
        resolve(y)
      }
    })
  })
}
casoDB.contarCasosResumen = function (query,f1,f2,slice,estado){
  return new Promise(function (resolve,reject){
    const fecha1 = new Date(f1);
    const fecha2 = new Date(f2);
    let y = Caso.aggregate( [
      {
        $match: query
      },
      {
        $project: {
          estado: 1,
          cambio: {
            $arrayElemAt: [ "$cambiosDeEstado", slice ]
          }
        }
      },
      {
        $project: {
          estado: 1,
          fecha: {
            $dateFromString: {
              dateString: "$cambio.fecha"
            }
          }
        }
      },

      {
        $match: {
          estado,
          fecha: {
            "$gte": fecha1, "$lte": fecha2
          }
        }
      },
      {
        $count:"length"
      }

    ], function(err,y){
      if (err){
        reject(err)
      }
      else{
        if(y[0]){
          resolve(y[0].length)
        }
        else{
          resolve(0)

        }
      }
    })
  })
}
casoDB.darCasosSimple = function (){
  return new Promise(function (resolve,reject){
    Caso.distinct("ordenado", {},function(err, casos){
      if(err){
        reject(err);
      }
      else{
        resolve(casos);
      }
    });
  })
}

casoDB.darCasosCerrados = function (){
  return new Promise(function (resolve,reject){
    Caso.distinct("ordenado",{cerrado:true},function(err, casos){
      if(err){
        reject(err);
      }
      else{
        resolve(casos);
      }
    });
  })
}
casoDB.darCasosNoCerrados = function (){
  return new Promise(function (resolve,reject){
    Caso.find({cerrado:false},function(err, casos){
      if(err){
        reject(err);
      }
      else{
        resolve(casos);
      }
    });
  })
}
casoDB.darCasosIncorrectos = function (){
  return new Promise(function (resolve,reject){
    Caso.distinct("ordenado",{estado:"ASIGNACIÓN INCORRECTA"},function(err, casos){
      if(err){
        reject(err);
      }
      else{
        resolve(casos);
      }
    });
  })
}


casoDB.actualizarCasos =  function(batch,pObservacion,fecha,observaciones,modulo){

  return new Promise( async function(resolve, reject){
    let bulkCasos = Caso.collection.initializeOrderedBulkOp();
    for(let caso of batch){
      let observacion = observaciones? observaciones[caso.ordenado]:pObservacion
      let objAddToSet = modulo ? {cambiosDeEstado:{nuevoEstado:caso.estado,fecha,observacion},modulos:modulo}:{cambiosDeEstado:{nuevoEstado:caso.estado,fecha,observacion}}
      bulkCasos.find({ordenado:""+caso.ordenado})
      .updateOne({ 
        $set: caso,
        $addToSet:objAddToSet,
      })
    }
    bulkCasos.execute(function(err, bulkres){
      if (err){
        return reject(err);
      } 
      if (bulkres.result.nMatched===0){
        return resolve({success:false, message:"Los ordenados ingresados no coinciden con los de los casos registrados en el sistema."})
      }
      resolve({success:true, message:`De los ${batch.length} casos subidos, se actualizaron los ${bulkres.result.nMatched} disponibles en el sistema`})
    })
  });
}

interpretar = (serial)=>{
  if(!serial) return ""
  const num = Number.parseInt(serial);
  if(num ){
    if(serial.length === 5){
      const milis = Math.round((fechaCargue.valor - 25569)*86400*1000)//+3600*24*1000 solo para local, pues esto va a pasar a la hora en colombia (-5gmt), cuando sube a heroku es con la fecha real
      if( 1527173971106<milis && milis<1735707600000)
      {
        const event = new Date(milis);
        return `${event.getFullYear()}/${event.getMonth()+1}/${event.getDate()}`.toString()
      }
    }
  }
  return serial.toString()
}
interpretarFecha = (serial)=>{
  if (serial){
    const num = Number.parseInt(serial);
    if(num ){
      if(serial.length === 5){
        const milis = Math.round((serial - 25569)*86400*1000)//+3600*24*1000 solo para local, pues esto va a pasar a la hora en colombia (-5gmt), cuando sube a heroku es con la fecha real
        if( 1527173971106<milis && milis<1735707600000)
        {

          const event = new Date(milis);
          return `${event.getFullYear()}/${event.getMonth()+1}/${event.getDate()}`.toString()
        }
      }
    }
  }
  const event = new Date();
  event.setHours(event.getHours()-5);
  return `${event.getFullYear()}/${event.getMonth()+1}/${event.getDate()}`.toString()
}
casoDB.actualizarCasosCluster =  function(batch, nuevosAtributos,nombresAtributos,fechaActual){

  return new Promise( async function(resolve, reject){
    let bulkCasos = Caso.collection.initializeOrderedBulkOp();
    for(let caso of batch){
      bulkCasos.find({ordenado:""+caso.ordenado}).updateOne({ $pull:{atributosNuevos:{nombre:{$in:nombresAtributos}}}})
      if(caso.estado){
        let fechaCargue = nuevosAtributos[caso.ordenado].find(na=>
          na.nombre.toLowerCase().includes("fecha") && na.nombre.toLowerCase().includes("cargue"))
          let fecha ;
          if(fechaCargue && fechaCargue.valor.trim() !== ""){
            fecha = interpretarFecha(fechaCargue.valor)
          }
          else{
            fecha =  fechaActual
          }
          bulkCasos.find({ordenado:""+caso.ordenado}).updateOne({ $set: caso,$addToSet:{
            atributosNuevos:{$each:nuevosAtributos[caso.ordenado]},
            cambiosDeEstado:{nuevoEstado:caso.estado,fecha,observacion:"SUBIDO DESDE CLUSTER"}
          }
        })
      }else{
        bulkCasos.find({ordenado:""+caso.ordenado}).updateOne({ $set: caso,$addToSet:{
          atributosNuevos:{$each:nuevosAtributos[caso.ordenado]}
        }
      })
    }
  }

  bulkCasos.execute(function(err, bulkres){
    if (err) return reject(err);
    if (bulkres.result.nMatched===0)
    {
      return resolve({success:false, message:"Los ordenados ingresados no coinciden con los de los casos registrados en el sistema."})
    }
    return resolve({success:true, message:"Casos actualizados"})
  })
});

}
casoDB.resolverCasos =  function(batch){

  return new Promise( async function(resolve, reject){

    let bulkCasos = Caso.collection.initializeOrderedBulkOp();
    let lotes = {};
    for(let caso of batch){
      bulkCasos.find({ordenado:caso.ordenado}).upsert().updateOne(caso);
      lotes[caso.idLote] = lotes[caso.idLote]? lotes[caso.idLote] + 1: 1;
    }
    bulkCasos.execute(function(err, bulkres){
      if (err) return reject(err);
    });
    let result;
    for(let idLote in lotes){
      result =await loteDB.resolverCasos(idLote,lotes[idLote])
      if(!result.success){
        return reject(err.err);
      }
    }
    resolve({success:true, message:"Casos actualizados"})
  });

}


// Nuevos módulos

casoDB.darCasosEnModuloSimple = function(modulo){
  return new Promise(function (resolve,reject){
    Caso.find({modulos:modulo}).select("ordenado -_id").exec(function(err, casos){
      if(err){
        reject(err);
      }
      else{
        resolve(casos.map(c=>c.ordenado));
      }
    });
  })
}

casoDB.incluirCasosEnNuevoModulo = function(batch,modulo){
  return new Promise( async function(resolve, reject){
    if(batch.length > 0){
      let bulkCasos = Caso.collection.initializeOrderedBulkOp();
      for(let caso of batch){
        bulkCasos.find({ordenado:""+caso.ordenado})
        .updateOne({ 
          $set: caso,
          $addToSet:{
            cambiosDeEstado:caso.nuevoCambioDeEstado,
            modulos:modulo
          },
        })
      }
      bulkCasos.execute(function(err, bulkres){
        if (err){
          return reject(err);
        }
        resolve({success:true, casosActualizados: batch.length})
    })
  }else{
    resolve({success:true, casosActualizados: 0})
  }
});

}


module.exports = casoDB;
