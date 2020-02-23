require("dotenv").config();

let TelegramBot = require("node-telegram-bot-api");

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN env variable is missing");
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
let gameStart = false;
let spentCities = new Set();
let lastLetter = "";

bot.on("polling_error", m => console.log(m));

bot.on("message", msg => {
  const chatId = msg.chat.id;

  if (msg.text.toLowerCase() == "/start" && !gameStart) {
    console.log("20 " + chatId + " : " + msg.text);
    let welcomeMessage =
      "Приветствую тебя в игре Города.\nДля начала новой игры напиши Начать";
    bot.sendMessage(chatId, welcomeMessage);
  }

  if (msg.text.toLowerCase() == "сдаюсь" && gameStart) {
    bot.sendMessage(
      chatId,
      "Я выиграл!!! \nГорода которые были названы:\n" +
        [...spentCities].join(", ")
    );
    bot.sendMessage(chatId, "Давай еще сыграем!");
    session(false);
  }

  if ((msg.text.toLowerCase() == "начать" && !gameStart) || gameStart) {
    console.log("27 " + msg.text + " spentCities = " + spentCities.size);
    startGame(chatId, msg.text);
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
    "Харьков",
    "Цюрих",
    "Челябинск",
    "Шанхай",
    "Щёлково",
    "Ыгдыр",
    "Электросталь",
    "Юрмала",
    "Ялта"
  ];
  cities = cities.map(item => item.toLowerCase());
  city = city.toLowerCase();

  //  1. Отправлен сообщение: Привет начинаем игру
  if (!gameStart) {
    session(true);
    let startMessage =
      "Начинаем игру. \nЯ называю город, а ты должен в ответ назвать любой город \nначинающийся на последнюю букву моего города.\nГорода не должны повторятся.";

    bot.sendMessage(chatId, startMessage);

    let randCity = randomCity(cities); //проверить randomCity
    lastLetter = lastValidLetter(randCity);
    console.log("88 " + randCity + " буква: " + lastLetter);

    spentCities.add(randCity);
    console.log(spentCities);

    bot.sendMessage(chatId, firstSymbToUpperCase(randCity));
    return;
  }

  if (
    gameStart &&
    validMessage(chatId, city) &&
    chekCityInDB(chatId, city, lastLetter, cities)
  ) {
    spentCities.add(city);
    let sCity = selectCityByLetter(lastValidLetter(city), cities);
    //4. Если не осталось городов то писать «Я проиграл»
    if (sCity == -1 || sCity == undefined) {
      bot.sendMessage(
        chatId,
        "Игра окончена, я проиграл! \nГорода которые были названы:\n" +
          [...spentCities].join(", ")
      );
      bot.sendMessage(chatId, "Давай сыграем еще!");
      session(false);
      return;
    } else {
      spentCities.add(sCity);
      console.log(spentCities);
      lastLetter = lastValidLetter(sCity);
      //3. Ответить городом
      bot.sendMessage(chatId, firstSymbToUpperCase(sCity));
    }
  }
}

function session(start) {
  if (start) {
    gameStart = true;
  }
  if (!start) {
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
  //Условие ниже не срабатывает.. когда фильтр ничего не находит он должен вернуть пустой массив,
  //но проверка на пустой массив почему-то не срабатывает
  if (findCities == [] || findCities == undefined || findCities == NaN) {
    console.log("149 Город не найден");
    return -1;
  } else return randomCity(findCities);
}

function chekCityInDB(chatId, city, lastLetter, cities) {
  if (cities.includes(city)) {
    let findCity = cities.find(item => item[0] == lastLetter && item == city);

    if (findCity != city) {
      bot.sendMessage(
        chatId,
        "Нужно назвать город на букву " + lastLetter.toUpperCase()
      );
      return false;
    }
    //5. Если пользователь вводит город который уже вводил — ответить «нельзя повторять»
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
  return arrCities[getRandomInt(arrCities.length)];
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}