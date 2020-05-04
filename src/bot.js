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
  const lang = msg.from.language_code;
  const localize = (key) => i18nt.t(lang, key);
  const botContext = { translate: localize, chatID: msg.chat.id, text: msg.text.toLowerCase() };

  //if (chatID === 981418073) lang = "en";

  switch (true) {
    case botContext.text.match(new RegExp(botContext.translate("CMD_START"), "i")) !== null:
      onStart(botContext);
      return;
    case botContext.text.match(new RegExp(botContext.translate("CMD_START_GAME"), "i")) !== null:
      onStartGame(botContext);
      return;
    case botContext.text.match(new RegExp(botContext.translate("CMD_CONTINUE_GAME"), "i")) !== null:
      onContinueGame(botContext);
      return;
    case botContext.text.match(new RegExp(botContext.translate("CMD_START_NEW_GAME"), "i")) !==
      null:
      onNewGame(botContext);
      return;
    case botContext.text.match(new RegExp(botContext.translate("CMD_STOP_GAME"), "i")) !== null:
      onStopGame(botContext);
      return;
  }

  const sessions = await db.readProgressFromFile();
  if (botContext.chatID in sessions) {
    processMessages(sessions, botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function onStart(botContext) {
  const sessions = await db.readProgressFromFile();

  if (!(botContext.chatID in sessions)) {
    bot.sendMessage(botContext.chatID, botContext.translate("WELCOME"));
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("CONTINUE"));
  }
}

async function onStartGame(botContext) {
  let sessions = await db.readProgressFromFile();

  if (!(botContext.chatID in sessions)) {
    sessions = await db.makeSession(sessions, botContext);
    startGame(sessions, botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("CONTINUE"));
  }
}

async function onContinueGame(botContext) {
  const sessions = await db.readProgressFromFile();

  if (botContext.chatID in sessions) {
    bot.sendMessage(
      botContext.chatID,
      botContext.translate("CONT_LETS_PLAY") +
        [...sessions[botContext.chatID].spentCities].join(", ") +
        botContext.translate("CONT_CITY_ON_LETTER") +
        sessions[botContext.chatID].lastLetter.toUpperCase()
    );
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function onNewGame(botContext) {
  let sessions = await db.readProgressFromFile();

  if (botContext.chatID in sessions) {
    await db.deleteSession(sessions, botContext);
    sessions = await db.makeSession(sessions, botContext);
    startGame(sessions, botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function onStopGame(botContext) {
  const sessions = await db.readProgressFromFile();

  if (botContext.chatID in sessions) {
    bot.sendMessage(
      botContext.chatID,
      botContext.translate("WIN_MESSAGE") + [...sessions[botContext.chatID].spentCities].join(", ")
    );
    bot.sendMessage(botContext.chatID, botContext.translate("LETS_PLAY_AGAIN"));
    await db.deleteSession(sessions, botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function startGame(sessions, botContext) {
  const gStart = await game.start(sessions, botContext);

  if (gStart.messages[1] === botContext.translate("ERR_SELECT_CITY")) {
    bot.sendMessage(botContext.chatID, gStart.messages[1]);
    bot.sendMessage(botContext.chatID, botContext.translate("LOOSE_MESSAGE"));
    db.deleteSession(sessions, botContext);
    db.readProgressFromFile().then((result) => {
      sessions = result;
    });
  } else {
    helpers.sendBulkMessages(bot, botContext.chatID, gStart.messages);
  }
}

async function processMessages(sessions, botContext) {
  const processEnteredCity = await game.processEnteredCity(sessions, botContext);

  if (processEnteredCity.errorMsg === "" && processEnteredCity.messages.length === 1) {
    helpers.sendBulkMessages(bot, botContext.chatID, processEnteredCity.messages);
  }
  if (processEnteredCity.errorMsg === "" && processEnteredCity.messages.length > 1) {
    helpers.sendBulkMessages(bot, botContext.chatID, processEnteredCity.messages);
    db.deleteSession(sessions, botContext);
    db.readProgressFromFile().then((result) => {
      sessions = result;
    });
  }
  if (processEnteredCity.errorMsg !== "") {
    bot.sendMessage(botContext.chatID, processEnteredCity.errorMsg);
  }
}
