const log = require('debug')('app:training');
const spawn = require('child_process').spawn;
const EOL = require('os').EOL;
const path = require('path');
const { escapePythonMessage } = require('./utils.js');

const ABS_MAX_FEATURE = 10;

const COMMANDS = {
  READY: 'READY',
  DATA: 'DATA',
  END_DATA: 'END_DATA',
  END_TRAIN: 'END_TRAIN',
};

// Data expected format:
// [['A sentence with something', 1], ['Or not so good sentence', 0]]

function train(data) {
  if (typeof data === 'undefined') {
    throw new Error('Input data is required');
  }

  const cp = createTrainingProcess();

  return waitForProcessReady(cp)
  .then(() => {
    sendTrainingData(cp, data);
    log('Data sent');
    return waitForFinish(cp);
  });
}

function extractFeatures(data) {
  // Stretch percentage change (i.e -0.35, 0.3, 0) first to <-10, 10> range,
  // then shift it to <0, 20>
  return data.map((el) => {
    let range = Math.round(el[1] * 10);
    range = Math.min(ABS_MAX_FEATURE, range);
    range = Math.max(-ABS_MAX_FEATURE, range);
    range += ABS_MAX_FEATURE;

    return [el[0], range];
  });
}

function sendTrainingData(cp, data) {
  const write = str => cp.stdin.write(`${str}\n`);

  const dataWithFeatures = extractFeatures(data);

  write(COMMANDS.DATA);
  dataWithFeatures.forEach(bit => write(JSON.stringify(escapePythonMessage(bit))));
  write(COMMANDS.END_DATA);

  cp.stdout.on('data', (chunk) => {
    log(chunk.toString('utf-8'));
  });
}

function waitForFinish(cp) {
  return new Promise((resolve, reject) => {
    cp.stdout.on('data', chunk => chunk.toString('utf-8').split(EOL).map((str) => {
      if (str.indexOf(COMMANDS.END_TRAIN) === 0) {
        log('End train received');
        resolve(cp);
      }

      return false;
    }));
  });
}

function waitForProcessReady(cp) {
  return new Promise((resolve, reject) => {
    function listen(chunk) {
      chunk.toString('utf-8').split(EOL).forEach((item) => {
        if (item === COMMANDS.READY) {
          log('Train ready for input');
          cp.stdout.removeListener('data', listen);
          resolve();
        }
      });
    }

    cp.stdout.on('data', listen);
  });
}

function createTrainingProcess() {
  const cp = spawn('python', ['train.py'], {
    cwd: path.join(__dirname, 'cnn-text-classification-tf'),
  });
  cp.stdin.setEncoding('utf-8');

  cp.on('exit', () => {
    log('Python process died');
  });

  cp.stderr.on('data', chunk => log(chunk.toString('utf-8')));

  return cp;
}

module.exports = train;
