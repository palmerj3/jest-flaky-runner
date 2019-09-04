const circus = require('jest-circus/runner');
const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.cwd(), 'flaky-report.json');

let flakyReport = {};
if (fs.existsSync(reportPath)) {
  flakyReport = require(reportPath);
}

// TODO: cli option
let runCount = 10;
module.exports = async (globalConfig, config, environment, runtime, testPath) => {

  let results;
  while (runCount > 0) {
      // Have circus execute test
    results = await circus(globalConfig, config, environment, runtime, testPath);

    // Report all the failed tests
    const testFilePath = results.testFilePath;
    results.testResults.forEach((r) => {
      if (r.status === 'failed') {
        if (!flakyReport[testFilePath]) {
          flakyReport[testFilePath] = {};
        }

        if (!flakyReport[testFilePath][r.fullName]) {
          flakyReport[testFilePath][r.fullName] = {
            fails: 0
          }
        }

        flakyReport[testFilePath][r.fullName].fails++;
      }
    });

    runCount--;
  }

  fs.writeFileSync(reportPath, JSON.stringify(flakyReport, null, 2));

  // Pass control back to circus
  return circus(globalConfig, config, environment, runtime, testPath);
}
