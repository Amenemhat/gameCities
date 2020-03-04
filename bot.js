require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");
let game = require("./game.js");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const usedKeyWords = ["/start", "начать", "сдаюсь"];
const commands = {
  START: /\/start/i,
  START_GAME: /начать/i,
  STOP_GAME: /сдаюсь/i
};

bot.on("polling_error", m => console.log(m));

bot.onText(commands.START, msg => {
  const chatID = msg.chat.id;

  if (!(chatID in game.sessions)) {
    let welcomeMessage =
      "Приветствую тебя в игре Города.\nДля начала новой игры напиши Начать";
    bot.sendMessage(chatID, welcomeMessage);
  }
});

bot.onText(commands.START_GAME, msg => {
  const chatID = msg.chat.id;

  if (!(chatID in game.sessions)) {
    game.sessions.makeSession(chatID);

    let start = game.start(chatID);
    start.messages.map(messageItem => bot.sendMessage(chatID, messageItem));
  }
});

bot.onText(commands.STOP_GAME, msg => {
  const chatID = msg.chat.id;

  if (chatID in game.sessions) {
    bot.sendMessage(
      chatID,
      "Я выиграл!!! \nГорода которые были названы:\n" +
        [...game.sessions[chatID].spentCities].join(", ")
    );
    bot.sendMessage(chatID, "Давай еще сыграем! \nДля начала напиши Начать.");
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
