const createAnalyzer = require('./index.js');

// process.stdin.resume();

// another file
(async function mockListenAndTrade() {
  const anTex = [];
  for(var i = 0; i < 1; i++) {
    anTex.push(await createAnalyzer());
  }
  i = 0;

  // setInterval(async () => {
    console.time('textan');
    const response = await anTex[i]('beat exectations');
    i++;
    if(i === anTex.length) {
      i = 0;
    }

    console.timeEnd('textan');
    console.log('response received: ', response);

  //}, 3);
})();
