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
let botMessages = {};
commands();

bot.on("polling_error", (m) => {
  throw new Error(m);
});

async function commands() {
  botMessages = await lang.readLang();

  bot.onText(botMessages.commands.START, onStart);
  bot.onText(botMessages.commands.START_GAME, onStartGame);
  bot.onText(botMessages.commands.CONTINUE_GAME, onContinueGame);
  bot.onText(botMessages.commands.START_NEW_GAME, onNewGame);
  bot.onText(botMessages.commands.STOP_GAME, onStopGame);
  bot.on("message", onMessage);
}

async function onStart(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();
  botMessages = await lang.readLang(msg.from.language_code);

  if (!(chatID in sessions)) {
    bot.sendMessage(chatID, botMessages.WELCOME);
  } else {
    bot.sendMessage(chatID, botMessages.CONTINUE);
  }
}

async function onStartGame(msg) {
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();
  botMessages = await lang.readLang(msg.from.language_code);

  if (!(chatID in sessions)) {
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions);
  } else {
    bot.sendMessage(chatID, botMessages.CONTINUE);
  }
}

async function onContinueGame(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();
  botMessages = await lang.readLang(msg.from.language_code);

  if (chatID in sessions) {
    bot.sendMessage(
      chatID,
      botMessages.continueGame.LETS_PLAY +
        [...sessions[chatID].spentCities].join(", ") +
        botMessages.continueGame.CITY_ON_LETTER +
        sessions[chatID].lastLetter.toUpperCase()
    );
  } else {
    bot.sendMessage(chatID, botMessages.LIST_OF_COMMANDS);
  }
}

async function onNewGame(msg) {
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();
  botMessages = await lang.readLang(msg.from.language_code);

  if (chatID in sessions) {
    await db.deleteSession(chatID, sessions);
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions);
  } else {
    bot.sendMessage(chatID, botMessages.LIST_OF_COMMANDS);
  }
}

async function onStopGame(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();
  botMessages = await lang.readLang(msg.from.language_code);

  if (chatID in sessions) {
    bot.sendMessage(chatID, botMessages.WIN_MESSAGE + [...sessions[chatID].spentCities].join(", "));
    bot.sendMessage(chatID, botMessages.LETS_PLAY_AGAIN);
    await db.deleteSession(chatID, sessions);
  } else {
    bot.sendMessage(chatID, botMessages.LIST_OF_COMMANDS);
  }
}

async function onMessage(msg) {
  const chatID = msg.chat.id;
  botMessages = await lang.readLang(msg.from.language_code);

  for (const key in botMessages.commands) {
    if (msg.text.match(botMessages.commands[key])) return null;
  }
  const sessions = await db.readProgressFromFile();
  if (chatID in sessions) {
    processMessages(chatID, sessions, msg.text.toLowerCase());
  } else {
    bot.sendMessage(chatID, botMessages.LIST_OF_COMMANDS);
  }
}

async function startGame(chatID, sessions) {
  const gStart = await game.start(chatID, sessions, botMessages.language);

  if (gStart.messages[1] === botMessages.error.SELECT_CITY) {
    bot.sendMessage(chatID, gStart.messages[1]);
    bot.sendMessage(chatID, botMessages.LOOSE_MESSAGE);
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
