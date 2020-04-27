require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const game = require("./game.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const i18n = require("i18n");

i18n.configure({
  locales: ["en", "ru"],
  directory: "locales",
});

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
bot.on("polling_error", (m) => {
  throw new Error(m);
});

bot.on("message", onMessage);

async function onMessage(msg) {
  const chatID = msg.chat.id;
  i18n.setLocale(msg.from.language_code);

  if (msg.text.match(i18n.__("CMD_START")) !== null) {
    onStart(msg);
    return;
  }
  if (msg.text.match(i18n.__("CMD_START_GAME")) !== null) {
    onStartGame(msg);
    return;
  }
  if (msg.text.match(i18n.__("CMD_CONTINUE_GAME")) !== null) {
    onContinueGame(msg);
    return;
  }
  if (msg.text.match(i18n.__("CMD_START_NEW_GAME")) !== null) {
    onNewGame(msg);
    return;
  }
  if (msg.text.match(i18n.__("CMD_STOP_GAME")) !== null) {
    onStopGame(msg);
    return;
  }

  const sessions = await db.readProgressFromFile();
  if (chatID in sessions) {
    processMessages(chatID, sessions, msg.text.toLowerCase());
  } else {
    bot.sendMessage(chatID, i18n.__("LIST_OF_COMMANDS"));
  }
}

async function onStart(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (!(chatID in sessions)) {
    bot.sendMessage(chatID, i18n.__("WELCOME"));
  } else {
    bot.sendMessage(chatID, i18n.__("CONTINUE"));
  }
}

async function onStartGame(msg) {
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();

  if (!(chatID in sessions)) {
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions);
  } else {
    bot.sendMessage(chatID, i18n.__("CONTINUE"));
  }
}

async function onContinueGame(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    bot.sendMessage(
      chatID,
      i18n.__("CONT_LETS_PLAY") +
        [...sessions[chatID].spentCities].join(", ") +
        i18n.__("CONT_CITY_ON_LETTER") +
        sessions[chatID].lastLetter.toUpperCase()
    );
  } else {
    bot.sendMessage(chatID, i18n.__("LIST_OF_COMMANDS"));
  }
}

async function onNewGame(msg) {
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    await db.deleteSession(chatID, sessions);
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions);
  } else {
    bot.sendMessage(chatID, i18n.__("LIST_OF_COMMANDS"));
  }
}

async function onStopGame(msg) {
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    bot.sendMessage(chatID, i18n.__("WIN_MESSAGE") + [...sessions[chatID].spentCities].join(", "));
    bot.sendMessage(chatID, i18n.__("LETS_PLAY_AGAIN"));
    await db.deleteSession(chatID, sessions);
  } else {
    bot.sendMessage(chatID, i18n.__("LIST_OF_COMMANDS"));
  }
}

async function startGame(chatID, sessions) {
  const gStart = await game.start(chatID, sessions, i18n.__("language"));

  if (gStart.messages[1] === i18n.__("ERR_SELECT_CITY")) {
    bot.sendMessage(chatID, gStart.messages[1]);
    bot.sendMessage(chatID, i18n.__("LOOSE_MESSAGE"));
    db.deleteSession(chatID, sessions);
    db.readProgressFromFile().then((result) => {
      sessions = result;
    });
  } else {
    helpers.sendBulkMessages(bot, chatID, gStart.messages);
  }
}

async function processMessages(chatID, sessions, msg) {
  const processEnteredCity = await game.processEnteredCity(
    chatID,
    sessions,
    msg,
    i18n.__("language")
  );

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
