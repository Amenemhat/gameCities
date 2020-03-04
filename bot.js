require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");
let game = require("./game.js");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
let usedKeyWords = ["/start", "начать", "сдаюсь"];

bot.on("polling_error", m => console.log(m));

bot.onText(/\/start/i, msg => {
  const chatID = msg.chat.id;

  if (!(chatID in game.sessions)) {
    let welcomeMessage =
      "Приветствую тебя в игре Города.\nДля начала новой игры напиши Начать";
    bot.sendMessage(chatID, welcomeMessage);
  }
});

bot.onText(/начать/i, msg => {
  const chatID = msg.chat.id;

  if (!(chatID in game.sessions)) {
    game.sessions.makeSession(chatID);

    let start = game.start(chatID);
    start.messages.map(messageItem => bot.sendMessage(chatID, messageItem));
  }
});

bot.onText(/сдаюсь/i, msg => {
  const chatID = msg.chat.id;

  if (chatID in game.sessions) {
    bot.sendMessage(
      chatID,
      "Я выиграл!!! \nГорода которые были названы:\n" +
        [...game.sessions[chatID].spentCities].join(", ")
    );
    setTimeout(
      bot.sendMessage(chatID, "Давай еще сыграем! \nДля начала напиши Начать."),
      1000
    );
    console.log(game.sessions);
    game.sessions.deleteSession(chatID);
  }
});

bot.on("message", msg => {
  const chatID = msg.chat.id;
  if (usedKeyWords.includes(msg.text.toLowerCase())) return;

  if (chatID in game.sessions) {
    let main = game.main(chatID, msg.text.toLowerCase());

    if (main.errorMsg === "" && !main.stopGame) {
      main.messages.map(messageItem => bot.sendMessage(chatID, messageItem));
    }
    if (main.errorMsg === "" && main.stopGame) {
      main.messages.map(messageItem => bot.sendMessage(chatID, messageItem));
      console.log(game.sessions);
      game.sessions.deleteSession(chatID);
    }
    if (main.errorMsg != "") {
      bot.sendMessage(chatID, main.errorMsg);
    }
  }
});
