require("dotenv").config();

// Подключаем библиотеку для работы с Telegram API в переменную
let TelegramBot = require("node-telegram-bot-api");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

// Включить опрос сервера. Бот должен обращаться к серверу Telegram, чтобы получать актуальную информацию
let bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.on("polling_error", m => console.log(m));

bot.onText(/\/echo (.+)/, function(msg, match) {
  let chatId = msg.chat.id;
  let resp = match[1];
  bot.sendMessage(chatId, resp);
});

bot.on("message", function(msg) {
  if (msg.text.toLowerCase().includes("привет")) {
    let chatId = msg.chat.id;
    let message = "Привет!";
    bot.sendMessage(chatId, message);
  }
});

bot.on("message", function(msg) {
  if (msg.text.toLowerCase().includes("кот")) {
    let chatId = msg.chat.id;
    let photo = "tap.jpg";
    bot.sendPhoto(chatId, photo, { caption: "Милые котята" });
  }
});
