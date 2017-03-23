const log = require('debug')('app:main');
const spawn = require('child_process').spawn;

// const argv = require('minimist')(process.argv.slice(2));
// console.dir(argv);

process.stdin.resume();

log('Spawning python process');
const cp = spawn('src/test.py');

cp.stdout.on('data', chunk => {
    const text = chunk.toString('utf-8');
    log(text);
});

cp.stdin.setEncoding('utf-8');

const tick = setInterval(() => {
    cp.stdin.write("Wot in tarnation\n");
}, 1000);

cp.on('exit', () => {
    log("IT died");
    clearInterval(tick);
});