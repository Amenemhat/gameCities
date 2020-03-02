exports.validMessage = function(message) {
  let result = { isError: false, errorMsg: "" };
  let invalidSymbols = [" ", ".", ","];
  if (
    message.length <= 3 ||
    message.length > 30 ||
    invalidSymbols.findIndex(item => message.includes(item)) > -1
  ) {
    result.errorMsg =
      "Название города должно содержать одно слово, \nбез пробелов и знаков препинания, \nот 3 до 30 символов.";
    result.isError = true;
  }
  return result;
};

exports.firstSymbolToUpperCase = function(str) {
  return str[0].toUpperCase() + str.slice(1);
};

exports.getRandomInt = function(max) {
  return Math.floor(Math.random() * Math.floor(max));
};
