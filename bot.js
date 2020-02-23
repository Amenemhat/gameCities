require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
let gameStart = false;
let spentCities = new Set();

bot.on("polling_error", m => console.log(m));

bot.on("message", msg => {
  const chatId = msg.chat.id;

  if (msg.text.toLowerCase() == "/start" && !gameStart) {
    console.log(chatId + " : " + msg.text);
    let welcomeMessage =
      "Приветствую тебя в игре Города.\nДля начала новой игры напиши Начать";
    bot.sendMessage(chatId, welcomeMessage);
  }

  if ((msg.text.toLowerCase() == "начать" && !gameStart) || gameStart) {
    console.log(
      chatId + " : " + msg.text + " spentCities = " + spentCities.size
    );
    startGame(chatId, msg.text);
  }

  if (msg.text.toLowerCase() == "сдаюсь" && gameStart) {
    console.log(
      chatId + " : " + msg.text + " spentCities = " + spentCities.size
    );
    bot.sendMessage(
      chatId,
      "Я выиграл!!! \nГорода которые были названы:\n" + spentCities
    );
    bot.sendMessage(chatId, "Давай еще сыграем!");
    session(false);
  }
});

function startGame(chatId, city) {
  let cities = [
    "Архангельск",
    "Борисполь",
    "Воронеж",
    "Гюмри",
    "Донецк",
    "Енакиево",
    "Жуковский",
    "Запорожье",
    "Изюм",
    "Йошкар-Ола",
    "Киев",
    "Лондон",
    "Москва",
    "Николаев",
    "Орёл",
    "Париж",
    "Ростов",
    "Селидово",
    "Трускавец",
    "Уфа",
    "Флоренция",
    "Хабаровск",
    "Цюрих",
    "Челябинск",
    "Шанхай",
    "Щёлково",
    "Ыгдыр",
    "Электросталь",
    "Юрмала",
    "Ялта"
  ];
  let lastLetter = "";
  cities = cities.map(item => item.toLowerCase());
  city = city.toLowerCase();

  //  1. Отправлен сообщение: Привет начинаем игру
  if (!gameStart) {
    let startMessage =
      "Начинаем игру. \nЯ называю город, а ты должен в ответ назвать любой город \nначинающийся на последнюю букву моего города.\nГорода не должны повторятся.";

    bot.sendMessage(chatId, startMessage);

    let randCity = randomCity(cities);
    lastLetter = randCity[randCity.length - 1];
    bot.sendMessage(chatId, firstSymbToUpperCase(randCity));
    session(true);
    return;
  }

  if (
    gameStart &&
    validMessage(chatId, city) &&
    chekCityInDB(chatId, city, lastLetter, cities)
  ) {
    let sCity = selectCityByLetter(lastValidLetter(city), cities);
    if (sCity == -1) {
      bot.sendMessage(
        chatId,
        "Игра окончена, я проиграл! \nГорода которые были названы:\n" +
          spentCities
      );
      bot.sendMessage(chatId, "Давай еще сыграем!");
      session(false);
      return;
    } else {
      spentCities.add(sCity);
      bot.sendMessage(chatId, firstSymbToUpperCase(sCity));
    }
  }
}

function session(startStop) {
  if (startStop) {
    gameStart = true;
    spentCities.clear();
  }
  if (!startStop) {
    gameStart = false;
    spentCities.clear();
  }
}

function lastValidLetter(str) {
  let letter = str[str.length - 1];
  if (letter == "ь" || letter == "ъ") letter = str[str.length - 2];
  return letter;
}

function firstSymbToUpperCase(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function selectCityByLetter(letter, cities) {
  let findCities = cities.filter(
    item => item[0] == letter && !spentCities.has(item)
  );
  if (findCities == []) {
    return -1;
  } else return randomCity(findCities);
}
//сделать проверку первой буквы
function chekCityInDB(chatId, city, lastLetter, cities) {
  if (cities.includes(city)) {
    let findCity = cities.find(
      item => item[item.length - 1] == lastLetter && item == city
    );
    if (findCity != city) {
      bot.sendMessage(
        chatId,
        "Нужно назвать город на букву " + lastLetter.toUpperCase()
      );
      return false;
    }
    if (spentCities.has(city)) {
      bot.sendMessage(chatId, "Этот город уже был назван!");
      return false;
    }
    return true;
  } else {
    bot.sendMessage(chatId, "Я не знаю такого города!");
    return false;
  }
}
//  2. Проверить что сообщение - слово. И оно содержит более 3 символов и менее 30
function validMessage(chatId, city) {
  if (city.length > 3 && city.length <= 30 && !city.includes(" ", ".", ",")) {
    return true;
  } else {
    bot.sendMessage(
      chatId,
      "Название города должно содержать одно слово, \nбез пробелов и знаков препинания, \nот 3 до 30 символов."
    );
    return false;
  }
}

function randomCity(arrCities) {
  //console.log(arrCities);
  let city = arrCities[getRandomInt(arrCities.length)];
  spentCities.add(city);
  //console.log(spentCities);
  return city;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

/*
bot.on("message", msg => {
  if (msg.text.toLowerCase().includes("кот")) {
    chatId = msg.chat.id;
    console.log(chatId + " : " + msg.text + " gameStart = "+ gameStart);
    let photo = "tap.jpg";
    bot.sendPhoto(chatId, photo, { caption: "Милые котята" });
  }
});*/
