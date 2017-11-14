'use strict';

const forever = require('forever-monitor');
const child = new (forever.Monitor)('./src/entry-point.js');
const log = console.log;

child.on('watch:restart', function (info) {
  log(`\n[Forever] - Restarting script because ${info.file} changed.`);
});

child.on('restart', function () {
  log(`\n[Forever] - Restarting script for ${child.times} time.`);
});

child.on('exit:code', function (code) {
  log(`\n[Forever] - Detected script exited with code ${code}`);
  if (code === 255) {
    child.stop();
  } else if (code === 0) {
    child.restart();
  }
});

child.start();
