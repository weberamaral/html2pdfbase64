'use strict';

const cluster = require('cluster');
const path = require('path');
const del = require('del');
const html4base64 = require('./html2base64');
const utils = require('./utils');
const log = console.log;

const numThreads = require('os').cpus().length;

if (cluster.isMaster) {
  log(`====== HTML2PDF - Iniciando processo de conversão de arquivos =======`);
  const start = Date.now();

  const inputFiles = html4base64.getFiles(path.join(__dirname, 'input'));

  if (inputFiles.length === 0) {
    log('[Master] - Não existem arquivos para conversão. Processo encerrando....');
    process.exit(255);
  }

  const readFiles = [];
  const chunkFiles = utils.chunkArray(inputFiles, numThreads, true);
  log(`[Master] - Dividindo os arquivos em ${chunkFiles.length} partes.\n`);

  for (let t = 0; t < numThreads; t++) {
    const worker = cluster.fork();

    worker.on('message', function (workerFiles) {
      readFiles.push(workerFiles);
      log(`[Worker ${this.process.pid}] - Converteu com sucesso ${workerFiles.length} arquivos.`)
      this.destroy();
    });

    // Divisão do job entre as threads
    log(`[Master] - Enviando ${chunkFiles[t].length} arquivos para conversão para o WORKER ${worker.process.pid}`);
    worker.send(chunkFiles[t]);
  }

  cluster.on('exit', function (worker) {
    if (Object.keys(cluster.workers).length === 0) {
      log('\n[Master] - Todos os workers encerrados com sucesso.');
      log(`[Master] - Tempo total: ${(Date.now() - start)} ms`);
      log('[Master] - Removendo arquivos convertidos com sucesso. Aguarde...');
      del.sync([].concat.apply([], readFiles), { cwd: path.join(__dirname, 'input') });
      process.exit(0);
    }
  });

} else {
  // Worker
  process.on('message', function (files) {
    log(`[Worker ${process.pid}] - Iniciou a conversão dos arquivos`);
    html4base64.convert(files, function (convertFiles) {
      process.send(convertFiles);
    });
  });
}


