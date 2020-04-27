const places_api = require("./places_api.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const i18n = require("i18n");

i18n.configure({
  locales: ["en", "ru"],
  directory: "locales",
});

function randomCity(arrCities) {
  return arrCities[helpers.getRandomNumber(arrCities.length)];
}

function lastValidLetter(str) {
  let lastLetter = str[str.length - 1];
  let i = 2;

  while (i18n.__("invalidLetters").includes(lastLetter)) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
}

async function checkCityInGoogle(chatID, sessions, city) {
  const foundCity = await places_api.findCities(city, i18n.__("language"));

  if (foundCity === "over_query_limit") {
    return i18n.__("ERR_ENTER_ANOTHER_CITY");
  }
  if (city !== foundCity || foundCity === "zero_results") {
    return i18n.__("ERR_UNKNOWN_CITY") + sessions[chatID].lastLetter.toUpperCase();
  }
  return null;
}

function checkCityInDB(chatID, sessions, city, letter) {
  if (letter !== city[0]) {
    return i18n.__("ERR_CITY_ON_LETTER") + letter.toUpperCase();
  }
  if (sessions[chatID].spentCities.includes(city)) {
    return i18n.__("ERR_THIS_IS_SPENT_CITY");
  }
  return null;
}

async function selectCityByLetter(chatID, sessions, letter) {
  const findCities = await places_api.findCitiesByLetter(
    i18n.__("CITY") + letter,
    i18n.__("language")
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
  i18n.setLocale(langCode);
  const selectedCity = await selectCityByLetter(chatID, sessions, randomCity(i18n.__("alphabet")));
  const result = { messages: [] };
  result.messages.push(i18n.__("START_GAME"));

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
    result.messages.push(i18n.__("ERR_SELECT_CITY"));
    return result;
  }
}

async function processEnteredCity(chatID, sessions, city, langCode) {
  const result = { messages: [], errorMsg: "" };
  i18n.setLocale(langCode);
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
    result.messages.push(i18n.__("LOOSE_BOT") + [...sessions[chatID].spentCities].join(", "));
    result.messages.push(i18n.__("LETS_PLAY_AGAIN"));
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
