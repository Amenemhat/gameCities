let bot = require("./bot.js");
let helpers = require("./helpers.js");
let lastLetter = "";
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
].map(item => item.toLowerCase());

exports.session = class Session {
  constructor(id, chatId = 0) {
    this.id = id;
    this.chatId = chatId;
    this.spentCities = new Set();
  }
};

function randomCity(arrCities) {
  return arrCities[helpers.getRandomInt(arrCities.length)];
}

function lastValidLetter(str) {
  let lastLetter = str[str.length - 1];
  let invalidLetters = ["ь", "Ъ"];
  let i = 2;

  while (invalidLetters.includes(lastLetter) || str.length == i) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
}

function checkCityInDB(sessionId, city, letter) {
  let result = { isError: false, errorMsg: "" };

  if (letter != city[0]) {
    result.errorMsg = "Нужно назвать город на букву " + letter.toUpperCase();
    result.isError = true;
    return result;
  }
  if (bot.session[sessionId].spentCities.has(city)) {
    result.errorMsg = "Этот город уже был назван!";
    result.isError = true;
  }
  return result;
}

function selectCityByLetter(sessionId, letter, cities) {
  let findCities = [];
  findCities = cities.filter(
    item => item[0] == letter && !bot.session[sessionId].spentCities.has(item)
  );
  //Условие ниже не срабатывает.. когда фильтр ничего не находит он должен вернуть пустой массив,
  //но проверка на пустой массив почему-то не срабатывает
  if (findCities == [] || findCities == undefined || findCities == NaN) {
    console.log("game.js 84 Город не найден");
    return -1;
  } else return randomCity(findCities);
}

exports.start = function(sessionId) {
  let result = { message: [] };
  result.message.push(
    "Начинаем игру. \nЯ называю город, а ты должен в ответ назвать любой город \nначинающийся на последнюю букву моего города.\nГорода не должны повторятся."
  );
  console.log(bot.session);

  let selectedCity = randomCity(cities);
  bot.session[sessionId].spentCities.add(selectedCity);
  lastLetter = lastValidLetter(selectedCity);
  console.log("game.js 99 " + selectedCity + " буква: " + lastLetter);

  result.message.push(helpers.firstSymbolToUpperCase(selectedCity));
  return result;
};

exports.main = function(sessionId, city) {
  let result = { isError: false, stopGame: false, message: [], errorMsg: "" };

  let validMessageObj = helpers.validMessage(city);
  if (validMessageObj.isError) {
    result.isError = true;
    result.errorMsg = validMessageObj.errorMsg;
    console.log("game.js 112 " + result.errorMsg);
    return result;
  }

  let checkCityInDBObj = checkCityInDB(sessionId, city, lastLetter);
  if (checkCityInDBObj.isError) {
    result.isError = true;
    result.errorMsg = checkCityInDBObj.errorMsg;
    console.log("game.js 120 " + result.errorMsg);
    return result;
  }

  bot.session[sessionId].spentCities.add(city);
  console.log("game.js 125");
  console.log(bot.session[sessionId].spentCities);
  let selectedCity = selectCityByLetter(
    sessionId,
    lastValidLetter(city),
    cities
  );
  if (selectedCity == -1 || selectedCity == undefined) {
    result.message.push(
      "Игра окончена, я проиграл! \nГорода которые были названы:\n" +
        [...bot.session[sessionId].spentCities].join(", ")
    );
    result.message.push("Давай сыграем еще!");
    result.stopGame = true;
    return result;
  } else {
    bot.session[sessionId].spentCities.add(selectedCity);
    console.log("game.js 142");
    console.log(bot.session[sessionId].spentCities);
    lastLetter = lastValidLetter(selectedCity);
    result.message.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
};
