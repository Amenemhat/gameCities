function firstSymbolToUpperCase(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function getRandomNumber(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function sendBulkMessages(bot, chatID, messages) {
  return messages.forEach(messageItem => bot.sendMessage(chatID, messageItem));
}

module.exports = { firstSymbolToUpperCase, getRandomNumber, sendBulkMessages };
