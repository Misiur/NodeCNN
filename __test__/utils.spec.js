const log = require('debug')('app:test:utils');
const { decreaseVocabSize, clearSentence, clearTwitterMeta, createWordFrequencies, isolateTokens } = require('../utils.js');
require('chai').should();

describe('NodeCNN utils', () => {
  describe('clearSentence', () => {
    it('should clean newlines and multiple spaces', () => {
      let sentence = 'What on \n Gods green Earth  is this    ';
      sentence = clearSentence(sentence);
      sentence.should.be.equal('what on gods green earth is this');
    });
  });

  describe('isolateTokens', () => {
    it('should isolate tokens', () => {
      let sentence = 'What\'s that "governor"?';
      sentence = isolateTokens(sentence);
      sentence.should.be.equal('What \' s that  " governor "  ? ');
    });
  });

  describe('isolateTokens and clearSentence', () => {
    it('should isolate tokens and neatly clear the sentence', () => {
      let sentence = 'What\'s that \n"governor"?';
      sentence = clearSentence(isolateTokens(sentence));
      sentence.should.be.equal('what \' s that " governor " ?');
    });
  });

  describe('clearTwitterMeta', () => {
    it('should clear twitter metas', () => {
      let sentence = 'Hello $5.1 $NASDAQ AND #twitter';
      sentence = clearTwitterMeta(sentence);
      sentence.should.be.equal('Hello $5.1 AND');
    });
  });

  describe('createWordFrequencies', () => {
    it('should create sorted word frequencies map', () => {
      const sentences = [
        'Three',
        'Three two',
        'Three two one',
      ];
      createWordFrequencies(sentences).should.be.eql(new Map([['Three', 3], ['two', 2], ['one', 1]]));
    });
  });

  describe('decreaseVocabSize', () => {
    it('should decrease vocab size', () => {
      const sentences = [
        ['A quick brown $nasdaq fox jumps over a lazy dog', 0],
        ['No fox is to be #blessed left $13 behind', 5],
      ];

      decreaseVocabSize(sentences).should.be.eql([['quick brown fox jumps lazy dog', 0], ['no fox left $13 behind', 5]]);
    });
  });

  it('should be awesome', () => {});
});