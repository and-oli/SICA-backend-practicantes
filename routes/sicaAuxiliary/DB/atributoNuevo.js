const mongoose = require("mongoose"); // for working w/ our database
const AtributoNuevoSchema       = require("../../../models/sica/atributoNuevo");
const AtributoNuevo = mongoose.model("AtributoNuevo", AtributoNuevoSchema);

let archivoDB = {};

archivoDB.darAtributos = function (){

  return new Promise(function(resolve,reject){
    AtributoNuevo.find({}, function(err, docs){
      if (err) {
        reject(err);
      }
      else{
        resolve({success:true, atributosNuevos:docs});
      }
    })

  })
}
archivoDB.borrarAtributo = function (nombre){

  return new Promise(function(resolve,reject){
    AtributoNuevo.remove({nombre}, function(err, result){
      if (err) {
        reject(err);
      }
      else{
        if(result.n>0){
          resolve({success:true, message:"Atributo borrado"});
        }
        else{
          resolve({success:false, message:"No puede borrar ese atributo"});

        }
      }
    })

  })
}
archivoDB.guardarAtributosNuevos = function (atributosOBJ){

  const atributos = Object.keys(atributosOBJ)
  return new Promise(function (resolve, reject){
    guardarAtibuto(0)
    function guardarAtibuto(i){
      if(atributos.length === i ){
        return resolve ({success:true, message:"Atributos nuevos guardados"})
      }
      let nombre = atributos[i]
        AtributoNuevo.findOne({nombre}, function(err, doc){
          if (err) {
            reject(err);
          }
          else if (!doc){
            AtributoNuevo.create({nombre},function(err,lote){
              if (err) {
                reject(err);
              }
              else{
                  guardarAtibuto((i+1))
              }
            })
          }else{
            guardarAtibuto((i+1))
          }
        })
    }


  })
}




module.exports = archivoDB;
