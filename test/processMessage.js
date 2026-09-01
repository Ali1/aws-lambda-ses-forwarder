
/* global describe, it */

var assert = require("assert");
var fs = require("fs");

var index = require("../index");

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

describe('index.js', function() {
  describe('#processMessage()', function() {
    it('should process email data and make updates', function() {
      var data = {
        config: {},
        email: {
          source: "betsy@example.com"
        },
        emailData: fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.processed.txt").toString();
      return index.processMessage(data)
        .then(function(data) {
          assert.equal(normalizeNewlines(data.emailData),
            normalizeNewlines(emailDataProcessed),
            "processEmail updated email data");
        });
    });

    it('should preserve an existing Reply-To header in emails', function() {
      var data = {
        config: {},
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.replyto.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.processed.txt").toString();
      return index.processMessage(data)
        .then(function(data) {
          assert.equal(normalizeNewlines(data.emailData),
            normalizeNewlines(emailDataProcessed),
            "processEmail updated email data");
        });
    });

    it('should preserve an existing Reply-to header', function() {
      var data = {
        config: {},
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.replyto_case.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.replyto_case.processed.txt").toString();
      return index.processMessage(data)
        .then(function(data) {
          assert.equal(normalizeNewlines(data.emailData),
            normalizeNewlines(emailDataProcessed),
            "processEmail updated email data");
        });
    });

    it('should apply the configured Reply-To when the message has none',
      function() {
      var data = {
        config: {
          replyTo: "reception@example.com"
        },
        emailData: fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };

      return index.processMessage(data)
        .then(function(data) {
          assert.match(data.emailData, /^Reply-To: reception@example\.com$/m);
        });
    });

    it('should allow overriding the From header in emails', function() {
      var data = {
        config: {
          fromEmail: "noreply@example.com"
        },
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.fromemail.txt").toString();
      return index.processMessage(data)
        .then(function(data) {
          assert.equal(normalizeNewlines(data.emailData),
            normalizeNewlines(emailDataProcessed),
            "processEmail updated email data");
        });
    });

    it('should process multiline From header in emails', function() {
      var data = {
        config: {
          fromEmail: "noreply@example.com"
        },
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.from_multiline.source.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.from_multiline.processed.txt").toString();
      return index.processMessage(data)
        .then(function(data) {
          assert.equal(normalizeNewlines(data.emailData),
            normalizeNewlines(emailDataProcessed),
            "processEmail updated email data");
        });
    });

    it('should append the original sender and timestamp to the Subject',
      function() {
      var data = {
        config: {
          subjectSuffix: true
        },
        email: {
          source: "betsy@example.com"
        },
        emailData: fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      return index.processMessage(data)
        .then(function(data) {
          assert.match(data.emailData,
            /^Subject: Test message from Betsy \(from Betsy <betsy@example\.com>\)\d{4}-\d{2}-\d{2}T/m,
            "processEmail appended the sender and ISO timestamp");
        });
    });

    it('should allow overriding the To header in emails', function(done) {
      var data = {
        config: {
          toEmail: "actualTarget@example.com"
        },
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.toemail.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(normalizeNewlines(data.emailData),
            normalizeNewlines(emailDataProcessed),
            "processEmail updated email data");
          done();
        });
    });
  });
});
