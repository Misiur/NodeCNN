const log = require('debug')('app:evaluator');
const spawn = require('child_process').spawn;
const EOL = require('os').EOL;
const path = require('path');
const { clearSentence, unescape, clearLinks, normalizeGlyphs, clearTwitterMeta } = require('./utils.js');

const ABS_MAX_FEATURE = 10;

const consts = {
  ANALYZE: 'ANALYZE',
  READY: 'READY',
};

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
        cwd: path.join(__dirname, 'cnn-text-classification-tf'),
      });

      cp.stdin.setEncoding('utf-8');

      cp.on('exit', () => {
        this.status = this.STATUS.STOPPED;
        log('Python process died');
      });

      cp.promiseSolvers = [];

      // register for incoming data
      cp.stdout.on('data', chunk => chunk.toString('utf-8').split(EOL).forEach((str) => {
        if (str.indexOf(consts.READY) === 0) {
          log('READY received');
          this.status = this.STATUS.READY;
          resolve(cp);
        } else {
          log(str);
        }

        return false;
      }));

      cp.stderr.on('data', chunk => log(chunk.toString('utf-8')));
    });
  }

  stop() {
    this.cp.kill('SIGINT');
    this.status = this.STATUS.STOPPED;
    log('Analyzer stopped');
  }

  async analyze(text) {
    if (this.status !== this.STATUS.READY) {
      throw new Error(`Tried to call analyze when state is not ready (${this.status})`);
    }

    return new Promise((resolve, reject) => {
      const awaitAnalyzeResponse = chunk => chunk.toString('utf-8').split(EOL).forEach((str) => {
        if (str.indexOf(consts.ANALYZE) === 0) {
          const messages = str.split(consts.ANALYZE)[1].split(EOL)[0];
          this.cp.stdout.removeListener('data', awaitAnalyzeResponse);
          const data = JSON.parse(messages);
          data.sentiment -= ABS_MAX_FEATURE;
          resolve(data);
        }

        return false;
      });

      this.cp.stdout.on('data', awaitAnalyzeResponse);

      const sentence = clearTwitterMeta(normalizeGlyphs(clearLinks(clearSentence(unescape(text)))));
      this.cp.stdin.write(`${JSON.stringify({ id: this.messageId++, job: consts.ANALYZE, text: sentence })}\n`);
    });
  }
}

module.exports = Evaluator;
