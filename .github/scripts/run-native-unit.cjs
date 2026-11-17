'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

// Run the existing mocked AWS suite; no AWS account, mail delivery or database.
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ses-forwarder-unit-'));
const report = path.join(temporary, 'mocha.json');
try {
  const result = spawnSync(process.execPath, [
    'node_modules/mocha/bin/mocha.js', '--check-leaks', '--timeout', '3000',
    '--reporter', 'json', '--reporter-option', `output=${report}`,
  ], {stdio: 'inherit', windowsHide: true});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Native unit suite failed.');
  const data = JSON.parse(fs.readFileSync(report, 'utf8'));
  if (!Number.isInteger(data.stats?.tests) || data.stats.tests < 1
      || data.stats.pending !== 0 || data.stats.failures !== 0
      || data.stats.passes !== data.stats.tests) {
    throw new Error('Empty, skipped or incomplete unit results cannot be certified.');
  }
  console.log(`Passed ${data.stats.tests} native mocked AWS unit tests; no skips.`);
} finally {
  // Only this invocation's temporary report; no recursive removal or shared cache.
  if (fs.existsSync(report)) fs.unlinkSync(report);
  fs.rmdirSync(temporary);
}
