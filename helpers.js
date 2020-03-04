function firstSymbolToUpperCase(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function getRandomNumber(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = { firstSymbolToUpperCase, getRandomNumber };
