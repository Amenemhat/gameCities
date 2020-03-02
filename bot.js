require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");
let game = require("./game.js");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

let session = [];
let usedKeyWords = ["/start", "начать", "сдаюсь"];

bot.on("polling_error", m => console.log(m));

bot.onText(/\/start/i, msg => {
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
  let index = session.findIndex(
    sessionItem => sessionItem.chatId === msg.chat.id
  );

  if (session.length == 0 || index == -1) {
    session[session.length] = new game.session(session.length, msg.chat.id);
    index = session.length - 1;

    let start = game.start(index);
    start.message.map(messageItem =>
      bot.sendMessage(session[index].chatId, messageItem)
    );
  }
});

bot.onText(/сдаюсь/i, msg => {
  let index = session.findIndex(
    sessionItem => sessionItem.chatId === msg.chat.id
  );

  if (index >= 0) {
    bot.sendMessage(
      session[index].chatId,
      "Я выиграл!!! \nГорода которые были названы:\n" +
        [...session[index].spentCities].join(", ")
    );
    bot.sendMessage(session[index].chatId, "Давай еще сыграем!");
    console.log("bot.js 56 session: ");
    console.log(session);
    session.splice(index, 1);
  }
});

bot.on("message", msg => {
  if (usedKeyWords.includes(msg.text.toLowerCase())) return;

  let index = session.findIndex(
    sessionItem => sessionItem.chatId === msg.chat.id
  );
  if (index >= 0 && msg.chat.id == session[index].chatId) {
    console.log("69 " + session[index].chatId + " : " + msg.text);

    let main = game.main(index, msg.text.toLowerCase());
    if (!main.isError && !main.stopGame) {
      main.message.map(messageItem =>
        bot.sendMessage(session[index].chatId, messageItem)
      );
    }
    if (!main.isError && main.stopGame) {
      main.message.map(messageItem =>
        bot.sendMessage(session[index].chatId, messageItem)
      );
      console.log("bot.js 81 session: ");
      console.log(session);
      session.splice(index, 1);
    }
    if (main.isError) {
      bot.sendMessage(session[index].chatId, main.errorMsg);
    }
  }
});

module.exports.session = session;
