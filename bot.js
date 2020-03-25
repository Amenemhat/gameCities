require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");
let game = require("./game.js");
let helpers = require("./helpers.js");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

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
    game.makeSession(chatID);
    startGame(chatID);
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
    game.deleteSession(chatID);
  }
});

bot.on("message", msg => {
  const chatID = msg.chat.id;
  for (key in commands) {
    if (msg.text.match(commands[key])) return;
  }

  if (chatID in game.sessions) {
    processMessages(chatID, msg.text.toLowerCase());
  } else {
    bot.sendMessage(
      chatID,
      "Список доступных команд:\n/start\nНачать\nСдаюсь\nДля начала игры напиши Начать"
    );
  }
});

async function startGame(chatID) {
  let gStart = await game.start(chatID);
  if (gStart !== null || gStart !== undefined)
    helpers.sendBulkMessages(bot, chatID, gStart.messages);
}

async function processMessages(chatID, msg) {
  let processEnteredCity = await game.processEnteredCity(chatID, msg);

  if (
    processEnteredCity.errorMsg === "" &&
    processEnteredCity.messages.length === 1
  ) {
    helpers.sendBulkMessages(bot, chatID, processEnteredCity.messages);
  }
  if (
    processEnteredCity.errorMsg === "" &&
    processEnteredCity.messages.length > 1
  ) {
    helpers.sendBulkMessages(bot, chatID, processEnteredCity.messages);
    game.deleteSession(chatID);
  }
  if (processEnteredCity.errorMsg !== "") {
    bot.sendMessage(chatID, processEnteredCity.errorMsg);
  }
}
