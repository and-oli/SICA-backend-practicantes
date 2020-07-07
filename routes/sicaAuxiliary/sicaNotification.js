const mongoose = require("mongoose");
const NotificacionesSchema       = require("../../models/sica/notificaciones");
const Notificaciones = mongoose.model("Notificaciones", NotificacionesSchema);

let aux = {}

aux.appendNotification = function(req){
  return new Promise(function (resolve,reject){

    Notificaciones.findOne({}, function(err, not){
      if(err){
        console.error(err);
        resolve( {success:false,message:"Ocurrió un error grave"})
      }else{
        const ans = not&&req.decoded? not[req.decoded.role.toLowerCase()]:0
        resolve(
          {success:true,  noti:ans}
        )
      }
    })


  })

}
aux.nuevaNotificacion = function(req){

  Notificaciones.findOne({}, function(err, not){
    if(err){
      console.error(err);
      return {success:false,message:"Ocurrió un error grave"}
    }else if(req.decoded){
        const quien = (req.decoded.role.toLowerCase()==="codensa") ?"comsistelco":"codensa"
        not[quien] = 1;
        not.save(function(err){
          if(err)return err
        })
      }
  })

}
aux.reiniciarNotificaciones = function(req){

  Notificaciones.findOne({}, function(err, not){
    if(err){
      console.error(err);
      return {success:false,message:"Ocurrió un error grave"}
    }else if (req.decoded){
      not[req.decoded.role.toLowerCase()] = 0;
      not.save(function(err){
        if(err){
          console.error(errors);
          return err;
        }
      })
    }
  })

}
module.exports = aux;
