const jwt  = require("jsonwebtoken");
const config = require("../hid/config")
const superSecret = config.secret;
const mongoose = require("mongoose");
const SicaUserSchema       = require("../../models/sica/sicaUser");
const SicaUser = mongoose.model("SicaUser", SicaUserSchema);

let aux = {}

aux.checkToken = function(req, res,next){
  var token = req.body.token || req.query.token || req.headers["x-access-token"];
  if (token) {
    jwt.verify(token, superSecret, function(err, decoded) {
      if (err)
      return res.status(403).send({ success: false, message: "Error de autenticación, por favor refresque la aplicación." });
      else
      req.decoded = decoded;
    });
  } else {
      return res.status(403).send({
        success: false,
        message: "No token provided."
      });
  }
  next();
}

aux.getToken =function(req,res){
  SicaUser.findOne({
    username: req.body.username
  }).select("_id  username password role").exec(function(err, user) {
    if (err) throw err;

    // no user with that username was found or the role does not correspond to this user.
    if (!user || req.body.role !== user.role) {
      res.json({
        success: false,
        message: "Usuario incorrecto"
      });
    } else {
      // check if password matches
      var validPassword = user.comparePassword(req.body.password);
      if (!validPassword) {
        res.json({
          success: false,
          message: "Contraseña incorrecta"
        });
      } else {
        // if user is found and password is right
        // create a token
        var token = jwt.sign({
          _id: user.id,
          username: user.username,
          role: user.role,
        }, superSecret, {
          expiresIn: '24h' // expires in 24 hours
        });
        // return the information including token as JSON
        res.json({
          success: true,
          message: "Enjoy your token!",
          token
        });
      }
    }
  });
}
module.exports = aux;
