require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const game = require("./game.js");
const helpers = require("./helpers.js");
let sessions = {};

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

async function onStart(msg) {
  const chatID = msg.chat.id;
  sessions = await game.readProgressFromFile();

  if (!(chatID in sessions)) {
    const welcomeMessage =
      "Приветствую тебя в игре Города.\nДля начала новой игры напиши Начать";
    bot.sendMessage(chatID, welcomeMessage);
  }
}
bot.onText(commands.START, onStart);

async function onStartGame(msg) {
  //console.log("начать");
  const chatID = msg.chat.id;
  sessions = await game.readProgressFromFile();

  //console.log(sessions);
  if (!(chatID in sessions)) {
    await game.makeSession(chatID, sessions);
    sessions = await game.readProgressFromFile();
    startGame(chatID);
  }
}
bot.onText(commands.START_GAME, onStartGame);

async function onStopGame(msg) {
  //console.log("Сдаюсь");
  const chatID = msg.chat.id;
  sessions = await game.readProgressFromFile();

  //console.log(sessions);
  if (chatID in sessions) {
    bot.sendMessage(
      chatID,
      "Я выиграл!!! \nГорода которые были названы:\n" +
        [...sessions[chatID].spentCities].join(", ")
    );
    bot.sendMessage(chatID, "Давай еще сыграем! \nДля начала напиши Начать.");
    await game.deleteSession(chatID, sessions);
    sessions = await game.readProgressFromFile();
  }
}
bot.onText(commands.STOP_GAME, onStopGame);

async function onMessage(msg) {
  const chatID = msg.chat.id;
  for (const key in commands) {
    if (msg.text.match(commands[key])) return;
  }
  //console.log("bot.on, message: " + msg.text);
  sessions = await game.readProgressFromFile();

  //console.log(sessions);

  if (chatID in sessions) {
    processMessages(chatID, msg.text.toLowerCase());
  } else {
    bot.sendMessage(
      chatID,
      "Список доступных команд:\n/start\nНачать\nСдаюсь\nДля начала игры напиши Начать"
    );
  }
}
bot.on("message", onMessage);

async function startGame(chatID) {
  //console.log("startGame");
  //console.log(sessions);
  const gStart = await game.start(chatID, sessions);

  if (gStart.messages[1] === "Ошибка выбора города!") {
    bot.sendMessage(chatID, gStart.messages[1]);
    bot.sendMessage(
      chatID,
      "Игра окончена. \nДавай еще сыграем! \nДля начала напиши Начать."
    );
    game.deleteSession(chatID, sessions);
    game.readProgressFromFile().then(result => {
      sessions = result;
    });
  } else {
    helpers.sendBulkMessages(bot, chatID, gStart.messages);
  }
}

async function processMessages(chatID, msg) {
  //console.log("processMessages");
  //console.log(sessions);
  const processEnteredCity = await game.processEnteredCity(
    chatID,
    sessions,
    msg
  );

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
    game.deleteSession(chatID, sessions);
    game.readProgressFromFile().then(result => {
      sessions = result;
    });
  }
  if (processEnteredCity.errorMsg !== "") {
    bot.sendMessage(chatID, processEnteredCity.errorMsg);
  }
}
