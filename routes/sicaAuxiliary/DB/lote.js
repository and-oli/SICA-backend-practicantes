const mongoose = require("mongoose"); // for working w/ our database
const Lotechema       = require("../../../models/sica/lote");
const Lote = mongoose.model("Lote", Lotechema);

let loteDB = {};

loteDB.guardarLote = function (lote){
  return new Promise(function (resolve,reject){

    Lote.find({URLArchivo:lote.URLArchivo}, function(err, lotes){
        if(lotes.length>0){
          return resolve({success:false});
        }else{
          Lote.create(lote,function(err,lote){
            if (err) {
              reject(err);
            }
            else{
              resolve({idLote:lote._id,success:true});
            }
          })
        }

    })


  })
}

loteDB.darLotes = function (){
  return new Promise(function (resolve,reject){
    Lote.find({},function(err, lotes){
      if(err){
        reject(err);
      }
      else{
        resolve(lotes);
      }
    });
  })
}
loteDB.darLote = function (_id){
  return new Promise(function (resolve,reject){
    Lote.findById(_id,function(err, lotes){
      if(err){
        reject(err);
      }
      else{
        resolve(lotes);
      }
    });
  })
}
loteDB.borrarLote = function (_id){
  return new Promise(function (resolve,reject){
    Lote.remove({_id},function(err, lotes){
      if(err){
        reject(err);
      }
      else{
        resolve({success:true,message:"Lote borrado"});
      }
    });
  })
}
loteDB.resolverCasos= function (id,casos){
  return new Promise(function (resolve,reject){
    Lote.findById(id,function(err, lote){
      if(err){
        resolve(err);
      }
      else{
        lote.casosPendientes = lote.casosPendientes - casos;
        lote.save(function(err) {
          if (err){
            resolve({success:false,err});
          }else{
            resolve({ success: true });
          }
        });
      }
    });
  })
}

module.exports = loteDB;
