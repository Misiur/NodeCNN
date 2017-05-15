const log = require('debug')('app:utils');
const stopword = require('stopword');
const unescape = require('unescape');

function clearSentence(sentence) {
  return sentence.replace(/\n/g, ' ').replace(/ +/g, ' ').trim().toLowerCase();
}

function isolateTokens(sentence) {
  let cleanSentence = sentence;
  const tokens = ['"', '\'', ';', ':', '.', ',', '(', ')', '[', ']', '<', '>', '/', '&', '?', '!', '\'ll', '\'ve', '\'re', '\'s'];
  tokens.forEach(token => {
    cleanSentence = cleanSentence.split(token).join(` ${token} `);
  });

  return cleanSentence;
}

function clearLinks(sentence) {
  return sentence.split(' ').filter(word => {
    return !(/https?:\/\//ig.test(word));
  }).join(' ');
}

function clearStopwords(sentence) {
  return stopword.removeStopwords(sentence.split(' ')).join(' ');
}

function normalizeGlyphs(sentence) {
  return sentence.replace(/“|”/gi, '"').replace(/…/gi, '...');
}

function createWordFrequencies(sentences) {
  const wordFrequency = new Map();

  sentences.forEach(sentence => {
    sentence.split(' ').forEach(el => {
      const value = wordFrequency.get(el);
      if (value) {
        wordFrequency.set(el, value + 1);
      } else {
        wordFrequency.set(el, 1);
      }
    });
  });

  return new Map([...wordFrequency.entries()].sort((a, b) => b[1] - a[1]));
}

function clearTwitterMeta(sentence) {
  return sentence.split(' ').filter(word => {
    return !(/\$[a-zA-Z_\.]+/g.test(word)
        || word[0] === '#'
        || word[0] === '@');
  }).join(' ');
}

function deleteInfrequentWords(sentence, mostFrequentWords) {
  return sentence.split(' ').filter(word => {
    return mostFrequentWords.indexOf(word) !== -1;
  }).join(' ');
}

/*
* @param data             Training prepared data, in form [['Sentence', 1], ['Sentence 2', -5]]
* @param absoluteCutoff   Maximum number of words
* @return                 Training prepared data after cleaning and frequency cutoff
*/
function decreaseVocabSize(data, absoluteCutoff) {
  const newData = [];
  let sentences = [];
  const sentiments = [];

  for (let i = 0; i < data.length; ++i) {
    let [sentence, sentiment] = data[i];
    sentences.push(sentence);
  }

  const beforeFrequencies = createWordFrequencies(sentences);
  log(`Before ${beforeFrequencies.size}`);

  sentences = [];

  for (let i = 0; i < data.length; ++i) {
    let [sentence, sentiment] = data[i];
    sentiments.push(sentiment);
    sentence = unescape(sentence);
    sentence = clearSentence(sentence);
    sentence = clearLinks(sentence);
    sentence = normalizeGlyphs(sentence);
    sentence = isolateTokens(sentence);
    sentence = clearTwitterMeta(sentence);
    sentence = clearStopwords(sentence);
    sentences.push(sentence);
    newData.push([sentence, sentiment]);
  }

  const frequencies = createWordFrequencies(sentences);
  log(`After ${frequencies.size}`);
  const mostFrequentWords = [...frequencies.keys()].slice(0, absoluteCutoff);

  for (let i = 0; i < newData.length; ++i) {
    newData[i][0] = deleteInfrequentWords(newData[i][0], mostFrequentWords);
  }

  const finalFrequencies = createWordFrequencies(newData.map(el => el[0]));
  log(`Finally ${finalFrequencies.size}`);

  const fs = require('fs');
  const path = require('path');

  let str = '';
  frequencies.forEach((val, key) => {
    str += `${key}: ${val}\n`;
  })
  fs.writeFile(path.join(__dirname, 'frequencies.json'), str, (err) => {
    if (err) throw err;
  });

  // let i = 0;

  // frequencies.forEach((frequency, key) => {
  //   if (i > absoluteCutoff) return false;

  // });

  return newData;
}

module.exports = {
  decreaseVocabSize,
  isolateTokens,
  createWordFrequencies,
  clearSentence,
  clearTwitterMeta,
  unescape,
  normalizeGlyphs,
  clearLinks,
};
