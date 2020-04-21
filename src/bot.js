require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const game = require("./game.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const lang = require("./lang.js");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const commands = {
  START: /\/start/i,
  START_GAME: /начать/i,
  START_NEW_GAME: /заново/i,
  CONTINUE_GAME: /продолжить/i,
  STOP_GAME: /сдаюсь/i,
};
command();

bot.on("polling_error", (m) => {
  throw new Error(m);
});

async function command() {
  const botMessages = await lang.readLang();

  bot.onText(botMessages.commands.START, onStart);
  bot.onText(botMessages.commands.START_GAME, onStartGame);
  bot.onText(botMessages.commands.CONTINUE_GAME, onContinueGame);
  bot.onText(botMessages.commands.START_NEW_GAME, onNewGame);
  bot.onText(botMessages.commands.STOP_GAME, onStopGame);
  bot.on("message", onMessage);
}

async function onStart(msg) {
  const botMessages = await lang.readLang(msg.from.language_code);

  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (!(chatID in sessions)) {
    bot.sendMessage(chatID, botMessages.WELCOME);
  } else {
    bot.sendMessage(chatID, botMessages.CONTINUE);
  }
}

bot.onText(commands.START_GAME, onStartGame);
async function onStartGame(msg) {
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();

  if (!(chatID in sessions)) {
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions);
  } else {
    bot.sendMessage(
      chatID,
      "У вас есть незавершенная игра. Для продолжения напишите Продолжить \nЕсли хотите начать новую игру напишите Заново"
    );
  }
}

bot.onText(commands.CONTINUE_GAME, onContinueGame);
async function onContinueGame(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    bot.sendMessage(
      chatID,
      "Давай продолжим. \nВот города которые были названы:\n" +
        [...sessions[chatID].spentCities].join(", ") +
        "\nНужно назвать город на букву " +
        sessions[chatID].lastLetter.toUpperCase()
    );
  } else {
    bot.sendMessage(
      chatID,
      "Список доступных команд:\n/start\nНачать\nДля начала игры напиши Начать"
    );
  }
}

bot.onText(commands.START_NEW_GAME, onNewGame);
async function onNewGame(msg) {
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    await db.deleteSession(chatID, sessions);
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions);
  } else {
    bot.sendMessage(
      chatID,
      "Список доступных команд:\n/start\nНачать\nДля начала игры напиши Начать"
    );
  }
}

bot.onText(commands.STOP_GAME, onStopGame);
async function onStopGame(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    bot.sendMessage(
      chatID,
      "Я выиграл!!! \nГорода которые были названы:\n" + [...sessions[chatID].spentCities].join(", ")
    );
    bot.sendMessage(chatID, "Давай еще сыграем! \nДля начала напиши Начать.");
    await db.deleteSession(chatID, sessions);
  } else {
    bot.sendMessage(
      chatID,
      "Список доступных команд:\n/start\nНачать\nДля начала игры напиши Начать"
    );
  }
}

bot.on("message", onMessage);
async function onMessage(msg) {
  const chatID = msg.chat.id;
  for (const key in commands) {
    if (msg.text.match(commands[key])) return;
  }
  const sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    processMessages(chatID, sessions, msg.text.toLowerCase());
  } else {
    bot.sendMessage(
      chatID,
      "Список доступных команд:\n/start\nНачать\nДля начала игры напиши Начать"
    );
  }
}

async function startGame(chatID, sessions) {
  const gStart = await game.start(chatID, sessions);

  if (gStart.messages[1] === "Ошибка выбора города!") {
    bot.sendMessage(chatID, gStart.messages[1]);
    bot.sendMessage(chatID, "Игра окончена. \nДавай еще сыграем! \nДля начала напиши Начать.");
    db.deleteSession(chatID, sessions);
    db.readProgressFromFile().then((result) => {
      sessions = result;
    });
  } else {
    helpers.sendBulkMessages(bot, chatID, gStart.messages);
  }
}

async function processMessages(chatID, sessions, msg) {
  const processEnteredCity = await game.processEnteredCity(chatID, sessions, msg);

  if (processEnteredCity.errorMsg === "" && processEnteredCity.messages.length === 1) {
    helpers.sendBulkMessages(bot, chatID, processEnteredCity.messages);
  }
  if (processEnteredCity.errorMsg === "" && processEnteredCity.messages.length > 1) {
    helpers.sendBulkMessages(bot, chatID, processEnteredCity.messages);
    db.deleteSession(chatID, sessions);
    db.readProgressFromFile().then((result) => {
      sessions = result;
    });
  }
  if (processEnteredCity.errorMsg !== "") {
    bot.sendMessage(chatID, processEnteredCity.errorMsg);
  }
}
