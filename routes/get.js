var express = require('express');
var router = express.Router();
var S3 = require('aws-sdk/clients/s3');
var config = require('config');

router.get('/:date/:hash', function(req, res, next) {
  var s3 = new S3();
  var key = req.params.date + '/' + req.params.hash;

  var stream = s3.getObject({
    Bucket: config.get('s3').bucket,
    Key: key
  }, function(err, data){
    if(err){
      res.render('error', { message: err.message});
      return;
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename*=UTF-8\'\'' + data.Metadata.filename);
    res.send(data.Body);
  });
});

module.exports = router;
