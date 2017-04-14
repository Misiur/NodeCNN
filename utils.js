function escapePythonMessage(message) {
  return message.replace('\n', ' ').replace('  ', ' ');
}

module.exports = {
  escapePythonMessage,
};
