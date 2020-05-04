const places_api = require("./places_api.js");
const helpers = require("./helpers.js");
const db = require("./db.js");

function randomCity(arrCities) {
  return arrCities[helpers.getRandomNumber(arrCities.length)];
}

function lastValidLetter(str, botContext) {
  let lastLetter = str[str.length - 1];
  let i = 2;

  while (botContext.translate("INVALID_LETTERS").includes(lastLetter)) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
}

async function checkCityInGoogle(sessions, botContext) {
  const foundCity = await places_api.findCities(botContext);

  if (foundCity === "over_query_limit") {
    return botContext.translate("ERR_ENTER_ANOTHER_CITY");
  }
  if (botContext.text !== foundCity || foundCity === "zero_results") {
    return (
      botContext.translate("ERR_UNKNOWN_CITY") +
      sessions[botContext.chatID].lastLetter.toUpperCase()
    );
  }
  return null;
}

function checkCityInDB(sessions, botContext, letter) {
  if (letter !== botContext.text[0]) {
    return botContext.translate("ERR_CITY_ON_LETTER") + letter.toUpperCase();
  }
  if (sessions[botContext.chatID].spentCities.includes(botContext.text)) {
    return botContext.translate("ERR_THIS_IS_SPENT_CITY");
  }
  return null;
}

async function selectCityByLetter(sessions, botContext, letter) {
  const findCities = await places_api.findCitiesByLetter(
    botContext,
    botContext.translate("CITY") + letter
  );
  const result = findCities.filter(
    (item) => item[0] === letter && !sessions[botContext.chatID].spentCities.includes(item)
  );

  if (result.length === 0) {
    return null;
  } else {
    return randomCity(result);
  }
}

async function start(sessions, botContext) {
  const selectedCity = await selectCityByLetter(
    sessions,
    botContext,
    randomCity(botContext.translate("ALPHABET"))
  );
  const result = { messages: [] };
  result.messages.push(botContext.translate("START_GAME"));

  if (
    selectedCity !== null &&
    selectedCity !== undefined &&
    !sessions[botContext.chatID].spentCities.includes(selectedCity)
  ) {
    sessions[botContext.chatID].spentCities.push(selectedCity);
    sessions[botContext.chatID].lastLetter = lastValidLetter(selectedCity, botContext);
    db.saveProgressToFile(sessions);
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));

    return result;
  } else {
    result.messages.push(botContext.translate("ERR_SELECT_CITY"));
    return result;
  }
}

async function processEnteredCity(sessions, botContext) {
  const result = { messages: [], errorMsg: "" };
  await db.readProgressFromFile().then((result) => {
    sessions = result;
  });

  const checkCityInGoogleResult = await checkCityInGoogle(sessions, botContext);
  if (checkCityInGoogleResult !== null) {
    result.errorMsg = checkCityInGoogleResult;
    return result;
  }

  const checkCityInDBResult = checkCityInDB(
    sessions,
    botContext,
    sessions[botContext.chatID].lastLetter
  );
  if (checkCityInDBResult !== null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  sessions[botContext.chatID].spentCities.push(botContext.text);
  db.saveProgressToFile(sessions);
  const selectedCity = await selectCityByLetter(
    sessions,
    botContext,
    lastValidLetter(botContext.text, botContext)
  );

  if (selectedCity === null || selectedCity === undefined) {
    result.messages.push(
      botContext.translate("LOOSE_BOT") + [...sessions[botContext.chatID].spentCities].join(", ")
    );
    result.messages.push(botContext.translate("LETS_PLAY_AGAIN"));
    return result;
  } else {
    sessions[botContext.chatID].spentCities.push(selectedCity);
    sessions[botContext.chatID].lastLetter = lastValidLetter(selectedCity, botContext);
    db.saveProgressToFile(sessions);

    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
}

module.exports = {
  start,
  processEnteredCity,
};
