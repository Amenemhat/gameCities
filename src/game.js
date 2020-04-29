const places_api = require("./places_api.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const I18nt = require("i18n-t");
const i18nt = new I18nt({
  defaultLocale: "en",
});
i18nt.load("locales");

function randomCity(arrCities) {
  return arrCities[helpers.getRandomNumber(arrCities.length)];
}

function lastValidLetter(str, lang) {
  let lastLetter = str[str.length - 1];
  let i = 2;

  while (i18nt.t(lang, "INVALID_LETTERS").includes(lastLetter)) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
}

async function checkCityInGoogle(chatID, sessions, city, lang) {
  const foundCity = await places_api.findCities(city, lang);

  if (foundCity === "over_query_limit") {
    return i18nt.t(lang, "ERR_ENTER_ANOTHER_CITY");
  }
  if (city !== foundCity || foundCity === "zero_results") {
    return i18nt.t(lang, "ERR_UNKNOWN_CITY") + sessions[chatID].lastLetter.toUpperCase();
  }
  return null;
}

function checkCityInDB(chatID, sessions, city, letter, lang) {
  if (letter !== city[0]) {
    return i18nt.t(lang, "ERR_CITY_ON_LETTER") + letter.toUpperCase();
  }
  if (sessions[chatID].spentCities.includes(city)) {
    return i18nt.t(lang, "ERR_THIS_IS_SPENT_CITY");
  }
  return null;
}

async function selectCityByLetter(chatID, sessions, letter, lang) {
  const findCities = await places_api.findCitiesByLetter(i18nt.t(lang, "CITY") + letter, lang);
  const result = findCities.filter(
    (item) => item[0] === letter && !sessions[chatID].spentCities.includes(item)
  );

  if (result.length === 0) {
    return null;
  } else {
    return randomCity(result);
  }
}

async function start(chatID, sessions, lang) {
  const selectedCity = await selectCityByLetter(
    chatID,
    sessions,
    randomCity(i18nt.t(lang, "ALPHABET")),
    lang
  );
  const result = { messages: [] };
  result.messages.push(i18nt.t(lang, "START_GAME"));

  if (
    selectedCity !== null &&
    selectedCity !== undefined &&
    !sessions[chatID].spentCities.includes(selectedCity)
  ) {
    sessions[chatID].spentCities.push(selectedCity);
    sessions[chatID].lastLetter = lastValidLetter(selectedCity, lang);
    db.saveProgressToFile(sessions);
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));

    return result;
  } else {
    result.messages.push(i18nt.t(lang, "ERR_SELECT_CITY"));
    return result;
  }
}

async function processEnteredCity(chatID, sessions, city, lang) {
  const result = { messages: [], errorMsg: "" };
  await db.readProgressFromFile().then((result) => {
    sessions = result;
  });

  const checkCityInGoogleResult = await checkCityInGoogle(chatID, sessions, city, lang);
  if (checkCityInGoogleResult !== null) {
    result.errorMsg = checkCityInGoogleResult;
    return result;
  }

  const checkCityInDBResult = checkCityInDB(
    chatID,
    sessions,
    city,
    sessions[chatID].lastLetter,
    lang
  );
  if (checkCityInDBResult !== null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  sessions[chatID].spentCities.push(city);
  db.saveProgressToFile(sessions);
  const selectedCity = await selectCityByLetter(
    chatID,
    sessions,
    lastValidLetter(city, lang),
    lang
  );

  if (selectedCity === null || selectedCity === undefined) {
    result.messages.push(i18nt.t(lang, "LOOSE_BOT") + [...sessions[chatID].spentCities].join(", "));
    result.messages.push(i18nt.t(lang, "LETS_PLAY_AGAIN"));
    return result;
  } else {
    sessions[chatID].spentCities.push(selectedCity);
    sessions[chatID].lastLetter = lastValidLetter(selectedCity, lang);
    db.saveProgressToFile(sessions);

    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
}

module.exports = {
  start,
  processEnteredCity,
};
