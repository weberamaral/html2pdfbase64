'use strict';

const fs = require('fs');
const path = require('path');
const bath = require('batchflow');
const base64 = require('base64-stream');
const pdf = require('html-pdf');

const options = {
  format: 'A3',
  childProcessOptions: {
    detached: true
  }
};

function filter(file) {
  const extension = path.extname(file);
  return extension === '.html';
}

/**
 *
 * @param files
 * @param callback
 */
module.exports.convert = function (files, callback) {
  const convertedFiles = [];

  bath(files).parallel().each(function (i, file, done) {
    const cpf = file.split('-')[0];
    const contrato = file.split('-')[1].split('.')[0];
    const html = fs.readFileSync(path.join(__dirname, 'input', file), 'utf8');
    pdf.create(html, options).toStream((err, stream) => {
      if (!err) {
        const txt = fs.createWriteStream(path.join(__dirname, 'output', `${cpf}-${contrato}.txt`));
        stream.pipe(base64.encode()).pipe(txt);
        convertedFiles.push(file);
      }
      done();
    });
  }).end(function () {
    callback(convertedFiles);
  });
}
/**
 *
 * @param path
 */
module.exports.getFiles = function (path) {
  const files = fs.readdirSync(path);
  return files.filter(filter);
}
