require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const game = require("./game.js");
const helpers = require("./helpers.js");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const commands = {
  START: /\/start/i,
  START_GAME: /начать/i,
  STOP_GAME: /сдаюсь/i
};

bot.on("polling_error", m => {
  throw new Error(m);
});

bot.onText(commands.START, msg => {
  const chatID = msg.chat.id;

  if (!(chatID in game.sessions)) {
    const welcomeMessage =
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

  for (const key in commands) {
    if (msg.text.match(commands[key])) return;
  }
  //console.log(game.sessions);

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
  const gStart = await game.start(chatID);
  if (gStart.messages[1] === "Ошибка выбора города!") {
    bot.sendMessage(chatID, gStart.messages[1]);
    bot.sendMessage(
      chatID,
      "Игра окончена. \nДавай еще сыграем! \nДля начала напиши Начать."
    );
    game.deleteSession(chatID);
  } else {
    helpers.sendBulkMessages(bot, chatID, gStart.messages);
  }
}

async function processMessages(chatID, msg) {
  const processEnteredCity = await game.processEnteredCity(chatID, msg);

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
