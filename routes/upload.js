var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var S3 = require('aws-sdk/clients/s3');
var crypto = require('crypto');
var config = require('config');

var upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, config.get('multer').tmpdir)
    },
    filename: function (req, file, cb) {
      cb(null, 's3-proxy-' + Date.now())
    }
  })
});

router.post('/', upload.single('file'), function(req, res, next) {
  if(!req.file){
    res.redirect('/');
    return;
  }

  var s3 = new S3();
  var body = fs.readFileSync(req.file.path);
  var date = new Date().toISOString().substr(0, 10).replace(/-/g, '');
  var hash = createHash(body);

  s3.putObject({
    Bucket: config.get('s3').bucket,
    Key: date + '/' + hash,
    Body: body,
    Metadata: {
      filename: encodeURIComponent(req.file.originalname),
      mimetype: req.file.mimetype
    }
  }, function(err, data){
    if(err){
      res.render('error', { message: err.message});
      return;
    }
    fs.unlink(req.file.path, function(){});
    res.render('upload', {
      url: req.headers.origin + '/get/' + date + '/' + hash,
      filename: req.file.originalname
    });
  });

});

function createHash(body){
  var shasum = crypto.createHash('sha1');
  shasum.update(body);
  return shasum.digest('hex');
}

module.exports = router;
