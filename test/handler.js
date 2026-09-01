
/* global describe, it */

var assert = require("assert");
var fs = require("fs");
var S3 = require("@aws-sdk/client-s3");
var SES = require("@aws-sdk/client-ses");

var index = require("../index");

describe('index.js', function() {
  describe('#handler()', function() {
    it('adapts the default AWS SDK v3 clients to callbacks', function(done) {
      var originalS3Send = S3.S3Client.prototype.send;
      var originalSesSend = SES.SESClient.prototype.send;
      var rejected = false;

      S3.S3Client.prototype.send = function(command) {
        assert.ok(command instanceof S3.GetObjectCommand);
        return Promise.resolve({
          Body: {
            transformToByteArray: function() {
              return Promise.resolve([101, 109, 97, 105, 108]);
            }
          }
        });
      };
      SES.SESClient.prototype.send = function(command) {
        assert.ok(command instanceof SES.SendRawEmailCommand);
        if (!rejected) {
          rejected = true;
          return Promise.resolve({MessageId: "test-message"});
        }
        return Promise.reject(new Error("expected SDK rejection"));
      };

      var restore = function() {
        S3.S3Client.prototype.send = originalS3Send;
        SES.SESClient.prototype.send = originalSesSend;
      };
      var steps = [
        function(data) {
          return new Promise(function(resolve, reject) {
            data.s3.getObject({}, function(err, result) {
              if (err) return reject(err);
              assert.ok(Buffer.isBuffer(result.Body));
              assert.equal(result.Body.toString(), "email");
              resolve(data);
            });
          });
        },
        function(data) {
          return new Promise(function(resolve, reject) {
            data.ses.sendRawEmail({}, function(err, result) {
              if (err) return reject(err);
              assert.equal(result.MessageId, "test-message");
              resolve(data);
            });
          });
        },
        function(data) {
          return new Promise(function(resolve) {
            data.ses.sendRawEmail({}, function(err) {
              assert.match(err.message, /expected SDK rejection/);
              resolve(data);
            });
          });
        }
      ];

      index.handler({}, {}, function(err) {
        restore();
        done(err);
      }, {steps: steps, log: function() {}});
    });

    it('mock data should result in a success', function(done) {
      var event = JSON.parse(fs.readFileSync("test/assets/event.json"));
      var context = {};
      var callback = function() {
        done();
      };
      var overrides = {
        s3: {
          copyObject: function(options, callback) {
            callback(null);
          },
          getObject: function(options, callback) {
            callback(null, {Body: "email data"});
          }
        },
        ses: {
          sendRawEmail: function(options, callback) {
            callback(null, {status: "ok"});
          }
        },
        config: {
          emailBucket: "bucket",
          emailKeyPrefix: "prefix/",
          forwardMapping: {
            "info@example.com": [
              "jim@example.com"
            ]
          }
        }
      };
      index.handler(event, context, callback, overrides);
    });

    it('should accept functions as steps', function(done) {
      var event = {};
      var context = {};
      var callback = function() {};
      var overrides = {
        steps: [
          function(data) {
            if (data && data.context) {
              done();
            }
          }
        ]
      };
      index.handler(event, context, callback, overrides);
    });

    it('should report failure for invalid steps', function(done) {
      var event = {};
      var context = {};
      var callback = function(err) {
        done(err ? null : true);
      };
      var overrides = {
        steps: [
          1,
          ['test']
        ]
      };
      index.handler(event, context, callback, overrides);
    });

    it('should report failure for steps passing an error', function(done) {
      var event = {};
      var context = {};
      var callback = function(err) {
        done(err ? null : true);
      };
      var overrides = {
        steps: [
          function(data, next) {
            next(true, data);
          }
        ],
        log: function() {
          assert.ok(true, "custom log function called successfully");
        }
      };
      index.handler(event, context, callback, overrides);
    });
  });
});
