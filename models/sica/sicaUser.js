var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose'); // for working w/ our database
var Schema = mongoose.Schema;

var SicaUserSchema = new Schema({
  username: String,
  password:  String,
  role:String
});

// hash the password before the user is saved
SicaUserSchema.pre('save', function(next) {
  let user = this;
  // hash the password only if the password has been changed or user is new
  if (!user.isModified('password')) return next();
  // generate the hash
  bcrypt.hash(user.password, null, null, function(err, hash) {
    if (err){
      console.error(err);
      return next(err);

    }// change the password to the hashed version
    user.password = hash;
    next();
  });
});
// method to compare a given password with the database hash
SicaUserSchema.methods.comparePassword = function(password) {
  var user = this;
  return bcrypt.compareSync(password, user.password);
};

// return the model
module.exports = SicaUserSchema;
//mongoose.model('User', UserSchema);
