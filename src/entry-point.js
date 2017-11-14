'use strict';

const cluster = require('cluster');
const path = require('path');
const del = require('del');
const html4base64 = require('./html2base64');
const utils = require('./utils');
const log = console.log;

const numThreads = require('os').cpus().length;
const inputFiles = html4base64.getFiles(path.join(__dirname, 'input')) || [];
const allocThreads = inputFiles.length < numThreads ? inputFiles.length : numThreads;
const readFiles = [];

if (cluster.isMaster) {
  if (allocThreads > 0) {
    log(`[HTML2PDF] Executando em ${allocThreads} thread(s)`);
  }
  const start = Date.now();

  if (inputFiles.length === 0) {
    log('[HTML2PDF] Não existem arquivos para conversão. Processo encerrando....\n');
    process.exit(255);
  }

  const chunkFiles = utils.chunkArray(inputFiles, allocThreads, true);
  log('[HTML2PDF] Distribuição de arquivos.')
  chunkFiles.map(function (value, i) {
    log(`[HTML2PDF] Thread ${i} ${value.length} arquivos`);
  });

  for (let t = 0; t < allocThreads; t++) {
    const worker = cluster.fork();

    worker.on('message', function (workerFiles) {
      readFiles.push(workerFiles);
      this.destroy();
    });

    // Divisão do job entre as threads
    worker.send(chunkFiles[t]);
  }

  cluster.on('exit', function () {
    if (Object.keys(cluster.workers).length === 0) {
      del.sync([].concat.apply([], readFiles), { cwd: path.join(__dirname, 'input') });
      log(`[HTML2PDF] Tempo total de execução: ${(Date.now() - start)} ms`);
      log('[HTML2PDF] Encerrando tarefa...');
      process.exit(0);
    }
  });

} else {
  // Worker
  process.on('message', function (files) {
    html4base64.convert(files, function (convertFiles) {
      process.send(convertFiles);
    });
  });
}


