const log = require('debug')('app:training');
const spawn = require('child_process').spawn;

const COMMANDS = {
  READY: 'READY',
  DATA: 'DATA',
  END_DATA: 'END_DATA'
};

// Data expected format:
// [['A sentence with something', 1], ['Or not so good sentence', 0]]

function train(data) {
  const cp = createTrainingProcess();
  waitForProcessReady(cp)
  .then(() => sendTrainingData(cp, data))
  .then(() => log('Data sent'));
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

function waitForProcessReady(cp) {
  return new Promise((resolve, reject) => {
    function listen(chunk) {
      chunk.toString('utf-8').split('\n').forEach((item) => {
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