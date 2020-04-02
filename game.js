let places_api = require("./places_api.js");
let helpers = require("./helpers.js");
let alphabet = "абвгдежзийклмнопрстуфхцшщыэюя";
let sessions = {};

function makeSession(chatID) {
  sessions[chatID] = { spentCities: new Set(), lastLetter: "" };
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

async function checkCityInGoogle(city) {
  console.log("Запрос: город " + city);
  let foundCity = await places_api.findCities(city);
  console.log("Ответ: " + foundCity);

  if (foundCity === "over_query_limit") {
    return "Введите другой город!";
  }
  if (city !== foundCity || foundCity === "zero_results") {
    return "Я такого города не знаю!";
  }
  return null;
}

function checkCityInDB(chatID, city, letter) {
  if (letter !== city[0]) {
    return "Нужно назвать город на букву " + letter.toUpperCase();
  }
  if (sessions[chatID].spentCities.has(city)) {
    return "Этот город уже был назван!";
  }
  return null;
}

async function selectCityByLetter(chatID, letter) {
  console.log("Ищем город на букву " + letter);
  let findCities = await places_api.findCitiesByLetter("город " + letter);
  let result = findCities.filter(
    item => item[0] === letter && !sessions[chatID].spentCities.has(item)
  );
  console.log(findCities);
  if (result.length === 0) {
    return null;
  } else {
    return randomCity(result);
  }
}

async function start(chatID) {
  let result = { messages: [] };
  result.messages.push(
    "Начинаем игру. \nЯ называю город, а ты должен в ответ назвать любой город \nначинающийся на последнюю букву моего города.\nГорода не должны повторятся."
  );
  let selectedCity = await selectCityByLetter(chatID, randomCity(alphabet));

  if (selectedCity !== null && selectedCity !== undefined) {
    sessions[chatID].spentCities.add(selectedCity);
    sessions[chatID].lastLetter = lastValidLetter(selectedCity);
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  } else {
    result.messages.push("Ошибка выбора города!");
    return result;
  }
}

async function processEnteredCity(chatID, city) {
  let result = { messages: [], errorMsg: "" };

  let checkCityInGoogleResult = await checkCityInGoogle(city);
  if (checkCityInGoogleResult !== null) {
    result.errorMsg = checkCityInGoogleResult;
    return result;
  }

  let checkCityInDBResult = checkCityInDB(
    chatID,
    city,
    sessions[chatID].lastLetter
  );
  if (checkCityInDBResult !== null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  sessions[chatID].spentCities.add(city);
  let selectedCity = await selectCityByLetter(chatID, lastValidLetter(city));
  if (selectedCity === null || selectedCity === undefined) {
    result.messages.push(
      "Игра окончена, я проиграл! \nГорода которые были названы:\n" +
        [...sessions[chatID].spentCities].join(", ")
    );
    result.messages.push("Давай сыграем еще! \nДля начала напиши Начать.");
    return result;
  } else {
    sessions[chatID].spentCities.add(selectedCity);
    sessions[chatID].lastLetter = lastValidLetter(selectedCity);
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
