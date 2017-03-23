const log = require('debug')('app:main');
const spawn = require('child_process').spawn;

// const argv = require('minimist')(process.argv.slice(2));
// console.dir(argv);

process.stdin.resume();

log('Spawning python process');
const cp = spawn('src/test.py');

cp.stdout.on('data', chunk => {
  log(JSON.parse(chunk.toString('utf-8')));
});

cp.stdin.setEncoding('utf-8');

let id = 0;
const tick = setInterval(() => {
  cp.stdin.write('Wot in tarnation\n');
  JSON.stringify({
    id,
    job: 'analyze',
    text: 'Siemens announced smart ovens and free pizza!'
  });
}, 1000);

cp.on('exit', () => {
  log('IT died');
  clearInterval(tick);
});
