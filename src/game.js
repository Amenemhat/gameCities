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

async function checkCityInGoogle(botContext) {
  const foundCity = await places_api.findCities(botContext);

  if (foundCity === "over_query_limit") {
    return botContext.translate("ERR_ENTER_ANOTHER_CITY");
  }
  if (botContext.text !== foundCity || foundCity === "zero_results") {
    return (
      botContext.translate("ERR_UNKNOWN_CITY") +
      botContext.sessions[botContext.chatID].lastLetter.toUpperCase()
    );
  }
  return null;
}

function checkCityInDB(botContext, letter) {
  if (letter !== botContext.text[0]) {
    return botContext.translate("ERR_CITY_ON_LETTER") + letter.toUpperCase();
  }
  if (botContext.sessions[botContext.chatID].spentCities.includes(botContext.text)) {
    return botContext.translate("ERR_THIS_IS_SPENT_CITY");
  }
  return null;
}

async function selectCityByLetter(botContext, letter) {
  const findCities = await places_api.findCitiesByLetter(
    botContext,
    botContext.translate("CITY") + letter
  );
  const result = findCities.filter(
    (item) =>
      item[0] === letter && !botContext.sessions[botContext.chatID].spentCities.includes(item)
  );

  if (result.length === 0) {
    return null;
  } else {
    return randomCity(result);
  }
}

async function start(botContext) {
  const selectedCity = await selectCityByLetter(
    botContext,
    randomCity(botContext.translate("ALPHABET"))
  );
  const result = { messages: [] };
  result.messages.push(botContext.translate("START_GAME"));

  if (
    selectedCity !== null &&
    selectedCity !== undefined &&
    !botContext.sessions[botContext.chatID].spentCities.includes(selectedCity)
  ) {
    botContext.sessions[botContext.chatID].spentCities.push(selectedCity);
    botContext.sessions[botContext.chatID].lastLetter = lastValidLetter(selectedCity, botContext);
    db.saveProgressToFile(botContext.sessions);
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));

    return result;
  } else {
    result.messages.push(botContext.translate("ERR_SELECT_CITY"));
    return result;
  }
}

async function processEnteredCity(botContext) {
  const result = { messages: [], errorMsg: "" };
  await db.readProgressFromFile().then((result) => {
    botContext.sessions = result;
  });

  const checkCityInGoogleResult = await checkCityInGoogle(botContext);
  if (checkCityInGoogleResult !== null) {
    result.errorMsg = checkCityInGoogleResult;
    return result;
  }

  const checkCityInDBResult = checkCityInDB(
    botContext,
    botContext.sessions[botContext.chatID].lastLetter
  );
  if (checkCityInDBResult !== null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  botContext.sessions[botContext.chatID].spentCities.push(botContext.text);
  db.saveProgressToFile(botContext.sessions);
  const selectedCity = await selectCityByLetter(
    botContext,
    lastValidLetter(botContext.text, botContext)
  );

  if (selectedCity === null || selectedCity === undefined) {
    result.messages.push(
      botContext.translate("LOOSE_BOT") +
        [...botContext.sessions[botContext.chatID].spentCities].join(", ")
    );
    result.messages.push(botContext.translate("LETS_PLAY_AGAIN"));
    return result;
  } else {
    botContext.sessions[botContext.chatID].spentCities.push(selectedCity);
    botContext.sessions[botContext.chatID].lastLetter = lastValidLetter(selectedCity, botContext);
    db.saveProgressToFile(botContext.sessions);

    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
}

module.exports = {
  start,
  processEnteredCity,
};
