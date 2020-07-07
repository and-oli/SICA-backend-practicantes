const express = require("express");
const router = express.Router();
const Multer = require("multer");
const fileUpload = require("./UploadImage");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const token = require("./sicaAuxiliary/sicaToken");
const SicaUserSchema       = require("../models/sica/sicaUser");
const SicaUser = mongoose.model("SicaUser", SicaUserSchema);
const logic = require("./sicaAuxiliary/logicFuncs")
const casoDB = require("./sicaAuxiliary/DB/caso")
const loteDB = require("./sicaAuxiliary/DB/lote")
const actividadDB = require("./sicaAuxiliary/DB/actividad")//
const archivoDB = require("./sicaAuxiliary/DB/archivo")//
const noti = require("./sicaAuxiliary/sicaNotification")//
const format = require("./sicaAuxiliary/format")//

const multer = Multer({
  storage: Multer.MemoryStorage,
  fileSize: 5 * 1024 * 1024
});
router.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type, Authorization,Accept,x-access-token");
  // res.setHeader("Access-Control-Allow-Headers", "Origin,Access-Control-Allow-Headers, Origin,Accept,Authorization, x-access-token,X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");

  next();
});
  router.post("/user", function(req, res) {
    // Necesario mientras el formulario para ingresar una nueva contraseña para cada usuario está habilitado.
    // El usuario debe ser agregado previamente utilizando el codigo de la parte de abajo.
    SicaUser.findOne({
      username: req.body.username
    }).select("_id  username password role").exec(function(err, user) {
      if (!user) {
        res.json({
          success: false,
          message: "Usuario incorrecto"
        });
      }
      else{
        user.password = req.body.password;
        user.save((err)=>{
          if(err){
            res.send({success:false, message: err});
          }
          else
          res.json({message:"¡Usuario registrado exitosamente!",success:true})
        })
      }
    });
    // Permite agregar nuevos usuarios.

    // let user = new SicaUser();
  
    // user.username = req.body.username;
    // user.password = req.body.password;
    // user.role = req.body.role;
  
    // user.save((err)=>{
    //   if(err){
    //     res.send(err);
    //   }
    //   else
    //   res.json({message:"success"})
    // })
    
  });
router.post("/authenticateSICA", function(req, res) {
  token.getToken(req,res);
});
router.get("/resumen",token.checkToken,async function(request, response, next) {
  try {
    const f1 = request.query.f1;
    const f2 = request.query.f2;
    const tipo = request.query.type;
    const modulo = request.query.module;
    const query ={modulos:modulo};
    const resumen = await logic.darResumen(query,f1,f2,tipo,modulo);
    const notificaciones = await noti.appendNotification(request);
    return response.json({success:true,resumen,notifications:notificaciones.noti});
  }catch(err){
    console.error(err);
    return response.json({success:false, message:"Ocurrió un error", err});
  }

});
router.get("/casos",token.checkToken,async function(request, response, next) {
  try {
    const query = (request.query.estado && request.query.estado !=="Todos"&& request.query.estado !=="Total")?{estado:request.query.estado}:{}
    const f1 = request.query.f1;
    const f2 = request.query.f2;
    const tipo = request.query.type;
    const lastId = request.query.lastId;
    const firstId = request.query.firstId;
    if(request.query.queryAttribute){
      query[request.query.queryAttribute] = request.query.queryAttributeValue;
    }
    const modulo = request.query.module;
    query.modulos = modulo;
    const casos = await logic.darCasos(query,f1,f2,tipo,lastId,firstId);
    const atributos = await logic.darAtributos(modulo);
    const notificaciones = await noti.appendNotification(request);
    return response.json({success:true, casos,atributos,notifications:notificaciones.noti});
  }catch(err){
    console.error(err);
    return response.json({success:false, message:"Ocurrió un error", err});
  }

});
router.get("/casosDescargar",token.checkToken,async function(request, response, next) {
  try {
    const query = (request.query.estado && request.query.estado !=="Todos"&& request.query.estado !=="Total")?{estado:request.query.estado}:{}
    const f1 = request.query.f1;
    const f2 = request.query.f2;
    const tipo = request.query.type;
    const lastId = request.query.lastId;
    const firstId = request.query.firstId;
    const modulo = request.query.module;
    if(request.query.queryAttribute){
      query[request.query.queryAttribute] = request.query.queryAttributeValue;
    query.modulos = modulo;
    }
    query.modulos = modulo;
    const casos = await logic.darCasosDescargar(query,f1,f2,tipo,lastId,firstId,modulo);
    if(casos){
      const atributos = await logic.darAtributos(modulo);
      return response.json({success:true, casos,atributos});
    }
    else{
      return response.json({success:false, message:"El número máximo permitido de casos en el consolidado es de 1000", code:1});
    }
  }catch(err){
    console.error(err);
    return response.json({success:false, message:"Ocurrió un error"});
  }

});
router.get("/casosDescargarMil",token.checkToken,async function(request, response, next) {
  try {
    const query = (request.query.estado && request.query.estado !=="Todos"&& request.query.estado !=="Total")?{estado:request.query.estado}:{}
    const f1 = request.query.f1;
    const f2 = request.query.f2;
    const tipo = request.query.type;
    const lastId = request.query.lastId;
    const firstId = request.query.firstId;
    const modulo = request.query.module;

    if(request.query.queryAttribute){
      query[request.query.queryAttribute] = request.query.queryAttributeValue;
    }
    query.modulos = modulo;
    const casos = await logic.darCasosDescargarMil(query,f1,f2,tipo,lastId,firstId,modulo);
    const atributos = await logic.darAtributos(modulo);
    const notificaciones = await noti.appendNotification(request);
    return response.json({success:true, casos,atributos,notifications:notificaciones.noti});
  }catch(err){
    console.error(err);
    return response.json({success:false, message:"Ocurrió un error", err});
  }

});
router.get("/lotes",token.checkToken, async function(request, response, next) {
  try {
    const lotes = await loteDB.darLotes();
    const notificaciones = await noti.appendNotification(request);
    return response.json({success:true, lotes,notifications:notificaciones.noti});
  }catch(err){
    console.error(err);
    return response.json({success:false, message:"Ocurrió un error", err});
  }

});

router.get("/actividades",token.checkToken, async function(request, response, next) {
  try {
    const lastId = request.query.lastId;
    const firstId = request.query.firstId;
    const actividades = await logic.darActividades(firstId,lastId);
    const notificaciones = await noti.appendNotification(request);
    return response.json({success:true, actividades,notifications:notificaciones.noti});
  }catch(error){
    console.error(error);
    return response.json({success:false, message:"Ocurrió un error", error});
  }

});
router.post("/borrarLote",token.checkToken, async function(request, response, next) {
  if(request.decoded){
    if(request.decoded.role==="Comsistelco"){
      try {
        const result = await logic.borrarLote(request.body.idActividad,request.body.idLote)
        return response.json(result);
      }catch(error){
        console.error(error);
        return response.json({success:false, message:"Ocurrió un error (18)"});
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.post("/nuevoLote",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){
    if(request.decoded.role==="Codensa"){
      try{
        const revisarNombre = await archivoDB.revisar(request.file.originalname)
        if(revisarNombre.success){
          const casoIncorrecto = await logic.hayCasosIncorrectos(request.file,request.query.module);
          if(!casoIncorrecto){
            const casosCerradosRepetidos = await logic.darCasosCerradosRepetidos(request.file,request.query.module);
            const infoLote = await logic.crearLote(request.file,request);
            if(infoLote){
              const idLote = infoLote.idLote;
              let result = {};
              switch (request.query.module){
                case "ANALISIS":
                  result = await logic.crearCasosAnalisis(request,idLote,casosCerradosRepetidos);
                  break;
                case "LIQUIDACION":
                  result = await logic.crearCasosLiquidacion(request,idLote,casosCerradosRepetidos);
                  break;
                case "BALANCE MACROMEDICION":
                case "NOVEDADES":
                case "STORIA":
                case "HALLAZGOS":
                case "INFORMATIVAS":
                  result = await logic.crearCasosModuloParametrizado(request,idLote,casosCerradosRepetidos,request.query.module);
                  break;
                default:
                  return response.json({success:false, message:`Error: Ocurrió  un error con el nombre del módulo ${request.query.module}.`});
              } 
              result.URLArchivo = infoLote.url
              result.idLote = infoLote.idLote
              if(result.success){
                await archivoDB.guardar(request.file.originalname)
                noti.nuevaNotificacion(request)
              }
              return response.json(result);
            }
            return response.json({success:false, message:"Error: un lote con ese nombre ya se había agregado"});
          }else{
            return response.json({success:false, message:`El caso con ordenado ${casoIncorrecto} ya había sido marcado con 'ASIGNACIÓN INCORRECTA'`});
          }
        }else{
          return response.json(revisarNombre);
        }
      }catch(error){
        console.error(error);
        return response.json({success:false, message:"Ocurrió un error, asegúrese que el archivo con el lote sigue el formato establecido."});
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }
  }

});

router.post("/cambiarEstadosACasos",token.checkToken,multer.single("file"), async function(request, response, next) {
  try{
    const result = await logic.cambiarEstadosACasos(request.body);
    if(result.success){
      noti.nuevaNotificacion(request)
    }
    return response.json(result);
  }catch(error){
    console.error(error);
    return response.json({success:false, message:"Ocurrió un error"});
  }
});


router.post("/actividad",token.checkToken, async function(request, response, next) {
  if(request.decoded){

    try{
      await logic.nuevaActividad(request.body);
      noti.nuevaNotificacion(request)
      return response.json({success:true,message:"Actividad registrada"});
    }catch(error){
      console.error(error);
      return response.json({success:false, message:"Ocurrió un error"});
    }
  }


});
router.post("/gestionTercerosAnalisis",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){

    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato =format.validarGestionTerceros(request.file);

      if(respuestaFormato.valido){
        try{
          const result = await logic.subirGestionTercerosAnalisis(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error (9), asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }  else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});
  router.post("/gestionTercerosLiquidacion",token.checkToken,multer.single("file"), async function(request, response, next) {
    if(request.decoded){
  
      if(request.decoded.role==="Comsistelco"){
        const revisarNombre = await archivoDB.revisar(request.file.originalname)
        if(!revisarNombre.success){
          return response.json(revisarNombre);
        }
        const respuestaFormato =format.validarGestionTerceros(request.file);
  
        if(respuestaFormato.valido){
          try{
            const result = await logic.subirGestionTercerosLiquidacion(request)
            if(result.success){
              await archivoDB.guardar(request.file.originalname)
              noti.nuevaNotificacion(request)
            }
            return response.json(result);
          }catch(error){
            console.error(error);
            return response.json({
              success: false,
              message: "Ocurrió un error (9), asegúrese que el formato del archivo subido sigue el correcto."
            });
          }
        }  else{
          return response.json({
            success: false,
            message: respuestaFormato.mensaje
          });
        }
      }
      else{
        return response.status(401).send({
          success: false,
          message: "No está autorizado para hacer esta acción."
        });
      }
  
    }
  });

  router.post("/gestionTercerosNovedades",token.checkToken,multer.single("file"), async function(request, response, next) {
    if(request.decoded){
  
      if(request.decoded.role==="Comsistelco"){
        const revisarNombre = await archivoDB.revisar(request.file.originalname)
        if(!revisarNombre.success){
          return response.json(revisarNombre);
        }
        const respuestaFormato =format.validarGestionTerceros(request.file);
  
        if(respuestaFormato.valido){
          try{
            const result = await logic.subirGestionTercerosNovedades(request)
            if(result.success){
              await archivoDB.guardar(request.file.originalname)
              noti.nuevaNotificacion(request)
            }
            return response.json(result);
          }catch(error){
            console.error(error);
            return response.json({
              success: false,
              message: "Ocurrió un error (9), asegúrese que el formato del archivo subido sigue el correcto."
            });
          }
        }  else{
          return response.json({
            success: false,
            message: respuestaFormato.mensaje
          });
        }
      }
      else{
        return response.status(401).send({
          success: false,
          message: "No está autorizado para hacer esta acción."
        });
      }
  
    }
  });
router.post("/otro",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){
    const revisarNombre = await archivoDB.revisar(request.file.originalname)
    if(!revisarNombre.success){
      return response.json(revisarNombre);
    }
    const result = await logic.subirOtro(request)
    if(result.success){
      await archivoDB.guardar(request.file.originalname)
      noti.nuevaNotificacion(request)
    }
    return response.json(result);
  }
});
router.post("/remitirOdt",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){

    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato =format.validarRemitirOdt(request.file);

      if(respuestaFormato.valido){
        try{
          const result = await logic.subirRemitirOdt(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error, asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }


    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.post("/finalizacionInspecciones",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){

    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato = format.validarFinalizacionInspecciones(request.file)
      if(respuestaFormato.valido){
        try{
          const result = await logic.subirFinalizacionInspeccion(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error (10), asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.post("/consolidadoAnalisis",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){
    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato = format.validarConsolidadoAnalisis(request.file)
      if(respuestaFormato.valido){
        try{
          const result = await logic.subirConsolidadoAnalisis(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error (40), asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.post("/reportesDeLiquidacion",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){

    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato = format.validarReportesDeLiquidacion(request.file)
      if(respuestaFormato.valido){
        try{
          const result = await logic.subirReportesDeLiquidacion(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error (34), asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.post("/consolidadoBalance",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){
    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato = format.validarConsolidadoBalance(request.file)
      if(respuestaFormato.valido){
        try{
          const result = await logic.subirConsolidadoBalance(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error (40), asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.post("/consolidadoNovedades",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){
    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato = format.validarConsolidadoNovedades(request.file)
      if(respuestaFormato.valido){
        try{
          const result = await logic.subirConsolidadoNovedades(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error (40), asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.post("/consolidadoStoria",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){
    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      const respuestaFormato = format.validarConsolidadoStoria(request.file)
      if(respuestaFormato.valido){
        try{
          const result = await logic.subirConsolidadoStoria(request)
          if(result.success){
            await archivoDB.guardar(request.file.originalname)
            noti.nuevaNotificacion(request)
          }
          return response.json(result);
        }catch(error){
          console.error(error);
          return response.json({
            success: false,
            message: "Ocurrió un error (40), asegúrese que el formato del archivo subido sigue el correcto."
          });
        }
      }else{
        return response.json({
          success: false,
          message: respuestaFormato.mensaje
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});

router.get("/reiniciarNotificaciones", token.checkToken,function(request, res) {
  noti.reiniciarNotificaciones(request)
  return res.send({success:true});
});

router.get("/atributosPorModulo", token.checkToken,function(request, res) {

  const atributos = logic.diccionarioAtributosPorModulo[request.query.module];
  return res.send({success:true, atributos });
});

router.get("/diccionarioDeEstados", token.checkToken,function(request, res) {
  return res.send({success:true, estadosPorModulo:logic.diccionarioEstadosPorModulo });
});

router.post("/nuevosAtributosACasos",token.checkToken,multer.single("file"), async function(request, response, next) {
  if(request.decoded){

    if(request.decoded.role==="Comsistelco"){
      const revisarNombre = await archivoDB.revisar(request.file.originalname)
      if(!revisarNombre.success){
        return response.json(revisarNombre);
      }
      try{
        const result = await logic.nuevosAtributosACasos(request)
        if(result.success){
          await archivoDB.guardar(request.file.originalname)
          noti.nuevaNotificacion(request)
        }
        return response.json(result);
      }catch(error){
        console.error(error);
        return response.json({
          success: false,
          message: "Ocurrió un error (13), asegúrese que el formato del archivo subido sigue el correcto."
        });
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }

  }
});
router.delete("/atributo",token.checkToken, async function(request, response, next) {
  if(request.decoded){

    if(request.decoded.role==="Comsistelco"){
      try{
        const result = await logic.borrarAtributo(request.body.name);
        return response.json(result);
      }catch(error){
        console.error(error);
        return response.json({success:false, message:"Ocurrió un error"});
      }
    }
    else{
      return response.status(401).send({
        success: false,
        message: "No está autorizado para hacer esta acción."
      });
    }
  }
});

router.get("/me", token.checkToken,function(req, res) {
  return res.send(req.decoded);
});


module.exports = router;
//Paginacion actividades
//nuevas tablas por proceso: nuevo logic
