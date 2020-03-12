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

let sessions = {};

function makeSession(chatID) {
  sessions[chatID] = { spentCities: new Set() };
}

function deleteSession(chatID) {
  delete sessions[chatID];
}

function randomCity(arrCities) {
  return arrCities[helpers.getRandomNumber(arrCities.length)];
}

function lastValidLetter(str) {
  let lastLetter = str[str.length - 1];
  let invalidLetters = ["ь", "ъ"];
  let i = 2;

  while (invalidLetters.includes(lastLetter)) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
}

function validateMessage(message) {
  let invalidSymbols = [" ", ".", ","];
  if (
    message.length <= 3 ||
    message.length > 30 ||
    invalidSymbols.findIndex(item => message.includes(item)) > -1
  ) {
    return "Название города должно содержать одно слово, \nбез пробелов и знаков препинания, \nот 3 до 30 символов.";
  }
  return null;
}

function checkCityInDB(chatID, city, letter) {
  if (letter != city[0]) {
    return "Нужно назвать город на букву " + letter.toUpperCase();
  }
  if (sessions[chatID].spentCities.has(city)) {
    return "Этот город уже был назван!";
  }
  return null;
}

function selectCityByLetter(chatID, letter, cities) {
  let findCities = cities.filter(
    item => item[0] == letter && !sessions[chatID].spentCities.has(item)
  );
  if (findCities.length === 0) {
    return null;
  } else {
    return randomCity(findCities);
  }
}

function start(chatID) {
  let result = { messages: [] };
  result.messages.push(
    "Начинаем игру. \nЯ называю город, а ты должен в ответ назвать любой город \nначинающийся на последнюю букву моего города.\nГорода не должны повторятся."
  );

  let selectedCity = randomCity(cities);
  sessions[chatID].spentCities.add(selectedCity);
  lastLetter = lastValidLetter(selectedCity);
  result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
  return result;
}

function processEnteredCity(chatID, city) {
  let result = { messages: [], errorMsg: "" };

  let validateMessageResult = validateMessage(city);
  if (validateMessageResult != null) {
    result.errorMsg = validateMessageResult;
    return result;
  }

  let checkCityInDBResult = checkCityInDB(chatID, city, lastLetter);
  if (checkCityInDBResult != null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  sessions[chatID].spentCities.add(city);
  let selectedCity = selectCityByLetter(chatID, lastValidLetter(city), cities);
  if (selectedCity === null || selectedCity === undefined) {
    result.messages.push(
      "Игра окончена, я проиграл! \nГорода которые были названы:\n" +
        [...sessions[chatID].spentCities].join(", ")
    );
    result.messages.push("Давай сыграем еще! \nДля начала напиши Начать.");
    return result;
  } else {
    sessions[chatID].spentCities.add(selectedCity);
    lastLetter = lastValidLetter(selectedCity);
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
}

module.exports = {
  sessions,
  makeSession,
  deleteSession,
  start,
  processEnteredCity
};
