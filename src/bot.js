require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const game = require("./game.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const score = require("./score.js");
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
  const userName = msg.from.first_name + " " + msg.from.last_name;
  const lang = msg.from.language_code;
  const localize = (key) => i18nt.t(lang, key);
  const botContext = {
    translate: localize,
    chatID: msg.chat.id,
    text: msg.text.toLowerCase(),
    userName: userName,
    hiScore: 0,
  };
  botContext.sessions = await db.readProgressFromFile();
  await score.getHiScore(botContext);

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
    case botContext.text.match(new RegExp(botContext.translate("CMD_TOP_10"), "i")) !== null:
      showTopScores(botContext);
      return;
  }

  if (botContext.chatID in botContext.sessions) {
    processMessages(botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function showTopScores(botContext) {
  const scoreFromFile = await score.readScoreFromFile();
  const scoreBoard = [];

  for (const key in scoreFromFile) {
    scoreBoard.push(scoreFromFile[key].hiScore + " - " + scoreFromFile[key].userName);
  }
  scoreBoard.sort((a, b) => {
    const a1 = a.split(" - ");
    const b1 = b.split(" - ");
    return b1[0] - a1[0];
  });
  scoreBoard.length = 10;
  bot.sendMessage(botContext.chatID, botContext.translate("TOP_10") + scoreBoard.join("\n"));
}

async function onStart(botContext) {
  if (!(botContext.chatID in botContext.sessions)) {
    bot.sendMessage(botContext.chatID, botContext.translate("WELCOME"));
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("CONTINUE"));
  }
}

async function onStartGame(botContext) {
  if (!(botContext.chatID in botContext.sessions)) {
    botContext.sessions = await db.makeSession(botContext);
    startGame(botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("CONTINUE"));
  }
}

async function onContinueGame(botContext) {
  if (botContext.chatID in botContext.sessions) {
    bot.sendMessage(
      botContext.chatID,
      botContext.translate("CONT_LETS_PLAY") +
        [...botContext.sessions[botContext.chatID].spentCities].join(", ") +
        botContext.translate("CONT_CITY_ON_LETTER") +
        botContext.sessions[botContext.chatID].lastLetter.toUpperCase()
    );
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function onNewGame(botContext) {
  if (botContext.chatID in botContext.sessions) {
    await db.deleteSession(botContext);
    botContext.sessions = await db.makeSession(botContext);
    startGame(botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function onStopGame(botContext) {
  if (botContext.chatID in botContext.sessions) {
    bot.sendMessage(
      botContext.chatID,
      botContext.translate("WIN_MESSAGE") +
        [...botContext.sessions[botContext.chatID].spentCities].join(", ") +
        botContext.translate("SCORE_IN_SESSION") +
        botContext.sessions[botContext.chatID].scoreInSession +
        botContext.translate("BEST_SCORE") +
        botContext.hiScore
    );
    bot.sendMessage(botContext.chatID, botContext.translate("LETS_PLAY_AGAIN"));
    await db.deleteSession(botContext);
  } else {
    bot.sendMessage(botContext.chatID, botContext.translate("LIST_OF_COMMANDS"));
  }
}

async function startGame(botContext) {
  const gStart = await game.start(botContext);

  if (gStart.messages[1] === botContext.translate("ERR_SELECT_CITY")) {
    bot.sendMessage(botContext.chatID, gStart.messages[1]);
    bot.sendMessage(botContext.chatID, botContext.translate("LOOSE_MESSAGE"));
    db.deleteSession(botContext);
    db.readProgressFromFile().then((result) => {
      botContext.sessions = result;
    });
  } else {
    helpers.sendBulkMessages(bot, botContext.chatID, gStart.messages);
  }
}

async function processMessages(botContext) {
  const processEnteredCity = await game.processEnteredCity(botContext);

  if (processEnteredCity.errorMsg === "" && processEnteredCity.messages.length === 1) {
    helpers.sendBulkMessages(bot, botContext.chatID, processEnteredCity.messages);
  }
  if (processEnteredCity.errorMsg === "" && processEnteredCity.messages.length > 1) {
    helpers.sendBulkMessages(bot, botContext.chatID, processEnteredCity.messages);
    db.deleteSession(botContext);
    db.readProgressFromFile().then((result) => {
      botContext.sessions = result;
    });
  }
  if (processEnteredCity.errorMsg !== "") {
    bot.sendMessage(botContext.chatID, processEnteredCity.errorMsg);
  }
}
