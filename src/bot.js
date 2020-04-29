require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const game = require("./game.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const I18nt = require("i18n-t");
const i18nt = new I18nt({
  defaultLocale: "en",
});
i18nt.load("locales");

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
  const lang = msg.from.language_code;

  switch (true) {
    case msg.text.match(new RegExp(i18nt.t(lang, "CMD_START"), "i")) !== null:
      onStart(msg);
      return;
    case msg.text.match(new RegExp(i18nt.t(lang, "CMD_START_GAME"), "i")) !== null:
      onStartGame(msg);
      return;
    case msg.text.match(new RegExp(i18nt.t(lang, "CMD_CONTINUE_GAME"), "i")) !== null:
      onContinueGame(msg);
      return;
    case msg.text.match(new RegExp(i18nt.t(lang, "CMD_START_NEW_GAME"), "i")) !== null:
      onNewGame(msg);
      return;
    case msg.text.match(new RegExp(i18nt.t(lang, "CMD_STOP_GAME"), "i")) !== null:
      onStopGame(msg);
      return;
  }

  const sessions = await db.readProgressFromFile();
  if (chatID in sessions) {
    processMessages(chatID, sessions, msg.text.toLowerCase(), lang);
  } else {
    bot.sendMessage(chatID, i18nt.t(lang, "LIST_OF_COMMANDS"));
  }
}

async function onStart(msg) {
  const lang = msg.from.language_code;
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (!(chatID in sessions)) {
    bot.sendMessage(chatID, i18nt.t(lang, "WELCOME"));
  } else {
    bot.sendMessage(chatID, i18nt.t(lang, "CONTINUE"));
  }
}

async function onStartGame(msg) {
  const lang = msg.from.language_code;
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();

  if (!(chatID in sessions)) {
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions, lang);
  } else {
    bot.sendMessage(chatID, i18nt.t(lang, "CONTINUE"));
  }
}

async function onContinueGame(msg) {
  const lang = msg.from.language_code;
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    bot.sendMessage(
      chatID,
      i18nt.t(lang, "CONT_LETS_PLAY") +
        [...sessions[chatID].spentCities].join(", ") +
        i18nt.t(lang, "CONT_CITY_ON_LETTER") +
        sessions[chatID].lastLetter.toUpperCase()
    );
  } else {
    bot.sendMessage(chatID, i18nt.t(lang, "LIST_OF_COMMANDS"));
  }
}

async function onNewGame(msg) {
  const lang = msg.from.language_code;
  const chatID = msg.chat.id;
  let sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    await db.deleteSession(chatID, sessions);
    sessions = await db.makeSession(sessions, chatID);
    startGame(chatID, sessions, lang);
  } else {
    bot.sendMessage(chatID, i18nt.t(lang, "LIST_OF_COMMANDS"));
  }
}

async function onStopGame(msg) {
  const lang = msg.from.language_code;
  const chatID = msg.chat.id;
  const sessions = await db.readProgressFromFile();

  if (chatID in sessions) {
    bot.sendMessage(
      chatID,
      i18nt.t(lang, "WIN_MESSAGE") + [...sessions[chatID].spentCities].join(", ")
    );
    bot.sendMessage(chatID, i18nt.t(lang, "LETS_PLAY_AGAIN"));
    await db.deleteSession(chatID, sessions);
  } else {
    bot.sendMessage(chatID, i18nt.t(lang, "LIST_OF_COMMANDS"));
  }
}

async function startGame(chatID, sessions, lang) {
  const gStart = await game.start(chatID, sessions, lang);

  if (gStart.messages[1] === i18nt.t(lang, "ERR_SELECT_CITY")) {
    bot.sendMessage(chatID, gStart.messages[1]);
    bot.sendMessage(chatID, i18nt.t(lang, "LOOSE_MESSAGE"));
    db.deleteSession(chatID, sessions);
    db.readProgressFromFile().then((result) => {
      sessions = result;
    });
  } else {
    helpers.sendBulkMessages(bot, chatID, gStart.messages);
  }
}

async function processMessages(chatID, sessions, msg, lang) {
  const processEnteredCity = await game.processEnteredCity(chatID, sessions, msg, lang);

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
