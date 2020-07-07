const mongoose = require("mongoose"); // for working w/ our database
const ArchivoSchema       = require("../../../models/sica/archivo");
const Archivo = mongoose.model("Archivo", ArchivoSchema);

let archivoDB = {};

archivoDB.revisar = function (nombre){

  return new Promise(function(resolve,reject){
    Archivo.findOne({nombre}, function(err, docs){
      if (err) {
        reject(err);
      }
      else{
        if(docs)
        resolve({success:false, message:"Ya existe un archivo con ese nombre en el sistema"});
        else
        resolve({message:"El archivo se puede guardar",success:true});
      }
    })

  })
}
archivoDB.guardar = function (nombre){

  return new Promise(function (resolve, reject){
    Archivo.create({nombre},function(err,lote){
      if (err) {
        reject(err);
      }
      else{
        resolve({message:"Archivo guardado",success:true});
      }
    })
  })
}

archivoDB.borrar = function (nombre){

  return new Promise(function(resolve,reject){
    Archivo.remove({nombre}, function(err, docs){
      if (err) {
        reject(err);
      }
      else{
        resolve({success:true});
      }
    })

  })
}


module.exports = archivoDB;
