const log = require('debug')('app:main');
const spawn = require('child_process').spawn;
const EOL = require('os').EOL;

const consts = {
  ANALYZE: 'ANALYZE',
  READY: 'READY'
}

class Evaluator {
  constructor() {
    this.STATUS = Object.freeze({
      NOT_READY: 0,
      READY: 1,
      STOPPED: 2,
    });
    this.status = this.STATUS.NOT_READY;
    this.cp = null;
    this.messageId = 0;
  }

  async start() {
    this.cp = await this.createCNNProcess();
  }

  async createCNNProcess() {
    return new Promise((resolve, reject) => {
      log('Spawning python process');
      const cp = spawn('python', ['eval.py', 'someOptions'], {
        cwd: __dirname + '/cnn-text-classification-tf'
      });

      cp.stdin.setEncoding('utf-8');

      cp.on('exit', () => {
        log('Python process died');
      });

      cp.promiseSolvers = [];

      // register for incoming data
      cp.stdout.on('data', chunk => {
        let str = chunk.toString('utf-8');

        str.split(EOL).map(str => {
          if(str.indexOf(consts.READY) === 0) {
            log('READY received');
            this.status = this.STATUS.READY;
            resolve(cp);
            return false;
          } else if(str.indexOf(consts.ANALYZE) === 0) {
            str = str.split(consts.ANALYZE)[1].split(EOL)[0];
            const data = JSON.parse(str);
            return false;
          } else {
            log(str);
          }
        });
      });

      cp.stderr.on('data', chunk => log(chunk.toString('utf-8')));
    });
  }

  stop() {
    this.cp.kill('SIGINT');
    this.status = this.STATUS.STOPPED;
    log('Analyzer stopped');
  }

  async analyze(text) {
    if(this.status !== this.STATUS.READY) {
      throw new Error(`Tried to call analyze when state is not ready (${this.status})`);
    }

    this.cp.stdin.write(JSON.stringify({ id: this.messageId, job: consts.ANALYZE, text }) + '\n');

    this.messageId++;
  }
}

module.exports = Evaluator;