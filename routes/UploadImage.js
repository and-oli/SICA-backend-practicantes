const storage = require('@google-cloud/storage');

const gcs = storage({
  projectId: 'intelligent-213800',
  keyFilename: "./routes/hid/secretkey.json"
});
const bucketName = 'intelligentimgbucket'
const bucket = gcs.bucket(bucketName);


function getPublicUrl(filename) {
  return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

let ImgUpload = {};
//Middleware
ImgUpload.uploadToGcs = (req, res, next) => {
  if(!req.file) return next();
  // Can optionally add a path to the gcsname below by concatenating it before the filename
  const gcsname = req.file.originalname;
  const file = bucket.file(gcsname);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    console.error(err);
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
    next();
  });

  stream.end(req.file.buffer);
}
ImgUpload.uploadToGcsSICA = (req) => {
  if(!req.file) return next();
  return new Promise(function(resolve, reject){
    const folderName =  "SICA/";
    // Can optionally add a path to the gcsname below by concatenating it before the filename
    const gcsname = folderName + req.file.originalname;
    const file = bucket.file(gcsname);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      }
    });

    stream.on('error', (err) => {
      console.error(err);
      reject(error);
    });

    stream.on('finish', () => {
      resolve(getPublicUrl(gcsname));
    });

    stream.end(req.file.buffer);

  })

}
module.exports = ImgUpload;
