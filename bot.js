require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");
let helpers = require("./helpers.js");
let game = require("./game.js");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
//let lastLetter = "";
let session = [];
let usedWords = ["/start", "начать", "сдаюсь"];

bot.on("polling_error", m => console.log(m));

bot.onText(/\/start/i, msg => {
  console.log("18 " + msg.chat.id + " : " + msg.text);
  let index = session.findIndex(
    sessionItem => sessionItem.chatId === msg.chat.id
  );
  if (index == -1) {
    let welcomeMessage =
      "Приветствую тебя в игре Города.\nДля начала новой игры напиши Начать";
    bot.sendMessage(msg.chat.id, welcomeMessage);
  }
});

bot.onText(/начать/i, msg => {
  console.log("26 " + msg.chat.id + " : " + msg.text);
  let index = session.findIndex(
    sessionItem => sessionItem.chatId === msg.chat.id
  );

  if (session.length == 0 || index == -1) {
    session[session.length] = new game.session(msg.chat.id);
    console.log("33 " + session[session.length - 1].chatId + " : " + msg.text);
    //let welcomeMessage = "Игра началась";
    game.start(session, session[session.length - 1], bot);
    //bot.sendMessage(msg.chat.id, welcomeMessage);
  }
});

bot.onText(/сдаюсь/i, msg => {
  console.log("41 " + msg.chat.id + " : " + msg.text);
  let index = session.findIndex(
    sessionItem => sessionItem.chatId === msg.chat.id
  );

  if (index >= 0) {
    console.log("47 session: " + session[index] + " : " + msg.text);
    bot.sendMessage(
      msg.chat.id,
      "Я выиграл!!! \nГорода которые были названы:\n" +
        [...session[index].spentCities].join(", ")
    );
    bot.sendMessage(session[index].chatId, "Давай еще сыграем!");
    session.splice(index, 1);
    console.log("55 session: " + session[index] + " : " + msg.text);
  }
});

bot.on("message", msg => {
  if (usedWords.includes(msg.text)) return;

  let index = session.findIndex(
    sessionItem => sessionItem.chatId === msg.chat.id
  );
  if (index >= 0 && msg.chat.id == session[index].chatId) {
    console.log("64 " + session[index].chatId + " : " + msg.text);
    session[index].spentCities.add(msg.text);
  }
});
