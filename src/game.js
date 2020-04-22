const places_api = require("./places_api.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const lang = require("./lang.js");
let botMessages = {};

function randomCity(arrCities) {
  return arrCities[helpers.getRandomNumber(arrCities.length)];
}

function lastValidLetter(str) {
  let lastLetter = str[str.length - 1];
  let i = 2;

  while (botMessages.invalidLetters.includes(lastLetter)) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
}

async function checkCityInGoogle(chatID, sessions, city) {
  const foundCity = await places_api.findCities(city, botMessages.language);

  if (foundCity === "over_query_limit") {
    return botMessages.error.ENTER_ANOTHER_CITY;
  }
  if (city !== foundCity || foundCity === "zero_results") {
    return botMessages.error.UNKNOWN_CITY + sessions[chatID].lastLetter.toUpperCase();
  }
  return null;
}

function checkCityInDB(chatID, sessions, city, letter) {
  if (letter !== city[0]) {
    return botMessages.error.CITY_ON_LETTER + letter.toUpperCase();
  }
  if (sessions[chatID].spentCities.includes(city)) {
    return botMessages.error.THIS_IS_SPENT_CITY;
  }
  return null;
}

async function selectCityByLetter(chatID, sessions, letter) {
  const findCities = await places_api.findCitiesByLetter(
    botMessages.CITY + letter,
    botMessages.language
  );
  const result = findCities.filter(
    (item) => item[0] === letter && !sessions[chatID].spentCities.includes(item)
  );

  if (result.length === 0) {
    return null;
  } else {
    return randomCity(result);
  }
}

async function start(chatID, sessions, langCode) {
  botMessages = await lang.readLang(langCode);
  const selectedCity = await selectCityByLetter(chatID, sessions, randomCity(botMessages.alphabet));
  const result = { messages: [] };
  result.messages.push(botMessages.START_GAME);

  if (
    selectedCity !== null &&
    selectedCity !== undefined &&
    !sessions[chatID].spentCities.includes(selectedCity)
  ) {
    sessions[chatID].spentCities.push(selectedCity);
    sessions[chatID].lastLetter = lastValidLetter(selectedCity);
    db.saveProgressToFile(sessions);
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));

    return result;
  } else {
    result.messages.push(botMessages.error.SELECT_CITY);
    return result;
  }
}

async function processEnteredCity(chatID, sessions, city, langCode) {
  const result = { messages: [], errorMsg: "" };
  botMessages = await lang.readLang(langCode);
  await db.readProgressFromFile().then((result) => {
    sessions = result;
  });

  const checkCityInGoogleResult = await checkCityInGoogle(chatID, sessions, city);
  if (checkCityInGoogleResult !== null) {
    result.errorMsg = checkCityInGoogleResult;
    return result;
  }

  const checkCityInDBResult = checkCityInDB(chatID, sessions, city, sessions[chatID].lastLetter);
  if (checkCityInDBResult !== null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  sessions[chatID].spentCities.push(city);
  db.saveProgressToFile(sessions);
  const selectedCity = await selectCityByLetter(chatID, sessions, lastValidLetter(city));

  if (selectedCity === null || selectedCity === undefined) {
    result.messages.push(botMessages.LOOSE_BOT + [...sessions[chatID].spentCities].join(", "));
    result.messages.push(botMessages.LETS_PLAY_AGAIN);
    return result;
  } else {
    sessions[chatID].spentCities.push(selectedCity);
    sessions[chatID].lastLetter = lastValidLetter(selectedCity);
    db.saveProgressToFile(sessions);

    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
}

module.exports = {
  start,
  processEnteredCity,
};
