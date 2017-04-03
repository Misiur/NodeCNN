const log = require('debug')('app:training');
const spawn = require('child_process').spawn;
const EOL = require('os').EOL;

const COMMANDS = {
  READY: 'READY',
  DATA: 'DATA',
  END_DATA: 'END_DATA',
  END_TRAIN: 'END_TRAIN'
};

// Data expected format:
// [['A sentence with something', 1], ['Or not so good sentence', 0]]

function train(data) {
  if (typeof data === 'undefined') {
    throw 'Input data is required';
  }

  const cp = createTrainingProcess();
  
  return waitForProcessReady(cp)
  .then(() => {
    sendTrainingData(cp, data);
    log('Data sent');
    return waitForFinish(cp);
  });
}

function sendTrainingData(cp, data) {
  const write = (str) => cp.stdin.write(str + '\n');

  if (data.length < 2 || !data.some(el => el[1] === 0) || !data.some(el => el[1] === 1)) {
    throw 'At least one sentence of each sentiment is required';
  }

  write(COMMANDS.DATA);
  data.forEach(bit => write(JSON.stringify(bit)))
  write(COMMANDS.END_DATA);

  cp.stdout.on('data', (chunk) => {
    log(chunk.toString('utf-8'));
  });
}

function waitForFinish(cp) {
  return new Promise((resolve, reject) => {
    cp.stdout.on('data', chunk => {
      chunk.toString('utf-8').split(EOL).map(str => {
        if(str.indexOf(COMMANDS.END_TRAIN) === 0) {
          log('End train received');
          resolve(cp);
          return false;
        }
      });
    });
  });
}

function waitForProcessReady(cp) {
  return new Promise((resolve, reject) => {
    function listen(chunk) {
      chunk.toString('utf-8').split(EOL).forEach((item) => {
        if(item === COMMANDS.READY) {
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
    cwd: __dirname + '/cnn-text-classification-tf'
  });
  cp.stdin.setEncoding('utf-8');

  cp.on('exit', () => {
    log('Python process died');
  });

  cp.stderr.on('data', chunk => log(chunk.toString('utf-8')));

  return cp;
}

module.exports = train;