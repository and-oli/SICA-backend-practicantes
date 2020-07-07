const mongoose = require("mongoose"); // for working w/ our database
const ActividadSchema = require("../../../models/sica/Actividad");
const ObjectId = require('mongodb').ObjectID;

const Actividad = mongoose.model("Actividad", ActividadSchema);

let actividadDB = {};

actividadDB.guardarActividad = function (actividad) {
  return new Promise(function (resolve, reject) {
    Actividad.create(actividad, function (err) {
      if (err) {
        reject(err);
      }
      else {
        resolve({ success: true });
      }
    })

  })
}
actividadDB.borrarActividad = function (_id) {
  return new Promise(function (resolve, reject) {
    Actividad.remove({ idActividadPadre: _id }, function (err) {
      if (err) {
        reject(err);
      }
      else {
        Actividad.remove({ _id }, function (err) {
          if (err) {
            reject(err);
          }
          else {
            resolve({ success: true });
          }
        })
      }
    })

  })
}
actividadDB.darActividades = function (firstId, lastId) {
  let query = {}
  return new Promise(function (resolve, reject) {
    if (firstId) {
      query['_id'] = { $gt: new ObjectId(firstId) }
    } else if (lastId) {
      query['_id'] = { $lt: new ObjectId(lastId) }
    } else {
      query['_id'] = { $lt: new ObjectId("ffffffffffffffffffffffff") }
    }
    query.profundidad = 0;
    Actividad.aggregate([
      {
        $match: query
      },
      {
        $sort: { _id: -1}
      },
      {
        $limit: 20
      }
    ], function (err, padres) {
      if (err) {
        reject(err)
      }
      else {
        if (padres.length > 0) {

          const ids = padres.map(a => a._id);

          Actividad.find({ idActividadPadre: { $in: ids } }, function (err, actividades) {
            if (err) {
              reject(err);
            }
            else {
              resolve([...padres, ...actividades]);
            }
          });
        }
        else{
          resolve([])
        } 
      }
    })
  })
}



module.exports = actividadDB;
