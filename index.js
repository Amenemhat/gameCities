<<<<<<< HEAD
=======
//<script src="./config.js"></script>;
console.log(test);
>>>>>>> ce2ab09e66604cd3e0fc968b2e024b2f41bee31a
const TOKEN = "798103621:AAF0HFbMM5F1G0MUJHTahjQu42tU0VoUhdk";
// Подключаем библиотеку для работы с Telegram API в переменную
var TelegramBot = require("node-telegram-bot-api");
// Включить опрос сервера. Бот должен обращаться к серверу Telegram, чтобы получать актуальную информацию
// Подробнее: https://core.telegram.org/bots/api#getupdates
var bot = new TelegramBot(TOKEN, { polling: true });

//обработчик события polling_error
bot.on("polling_error", m => console.log(m));

// Написать мне ... (/echo Hello World! - пришлет сообщение с этим приветствием, то есть "Hello World!")
bot.onText(/\/echo (.+)/, function(msg, match) {
  var fromId = msg.from.id; // Получаем ID отправителя
  var resp = match[1]; // Получаем текст после /echo
  bot.sendMessage(fromId, resp);
  console.log(resp);
});

bot.on("message", function(msg) {
  console.log(msg);
  if (msg.text.toLowerCase().includes("привет")) {
    var chatId = msg.chat.id; // Берем ID чата (не отправителя)
    var message = "Привет!";
    bot.sendMessage(chatId, message);
    console.log(message.toString());
  }
});

// Простая команда без параметров
bot.on("message", function(msg) {
  console.log(msg);
  if (msg.text.toLowerCase().includes("кот")) {
    var chatId = msg.chat.id; // Берем ID чата (не отправителя)
    // Фотография может быть: путь к файлу, поток (stream) или параметр file_id
    var photo = "tap.jpg"; // в папке с ботом должен быть файл "cats.png"
    bot.sendPhoto(chatId, photo, { caption: "Милые котята" });
    console.log(photo);
  }
});
