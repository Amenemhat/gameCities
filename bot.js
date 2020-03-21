require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");
let game = require("./game.js");
let places_api = require("./places_api.js");
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

    helpers.sendBulkMessages(bot, chatID, game.start(chatID).messages);
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
    places_api
      .findCities(msg.text)
      .then(foundCity =>
        processMessages(chatID, msg.text.toLowerCase(), foundCity.toLowerCase())
      );
  } else {
    bot.sendMessage(
      chatID,
      "Список доступных команд:\n/start\nНачать\nСдаюсь\nДля начала игры напиши Начать"
    );
  }
});

function processMessages(chatID, msg, foundCity) {
  console.log(foundCity);
  let processEnteredCity = game.processEnteredCity(chatID, msg, foundCity);

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
  if (processEnteredCity.errorMsg != "") {
    bot.sendMessage(chatID, processEnteredCity.errorMsg);
  }
  if (foundCity === "over_query_limit") {
    bot.sendMessage(chatID, "Введите другой город!");
  }
}
