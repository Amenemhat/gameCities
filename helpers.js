exports.validMessage = function(chatId, message) {
  if (message.length > 3 && message.length <= 30 && !message.includes(" ", ".", ",")) {
    return true;
  } else {
    bot.sendMessage(
      chatId,
      "Название города должно содержать одно слово, \nбез пробелов и знаков препинания, \nот 3 до 30 символов."
    );
    return false;
  }
};

exports.firstSymbToUpperCase = function(str) {
  return str[0].toUpperCase() + str.slice(1);
};

exports.getRandomInt = function(max) {
  return Math.floor(Math.random() * Math.floor(max));
};
