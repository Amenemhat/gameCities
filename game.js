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

function checkCityInGoogle(city, foundCity) {
  console.log("Запрос: город " + city);
  console.log("Ответ: " + foundCity);
  if (city != foundCity[0]) {
    return "Я такого города не знаю!";
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

function processEnteredCity(chatID, city, foundCities) {
  let result = { messages: [], errorMsg: "" };

  let checkCityInGoogleResult = checkCityInGoogle(city, foundCities);
  if (checkCityInGoogleResult != null) {
    result.errorMsg = checkCityInGoogleResult;
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
