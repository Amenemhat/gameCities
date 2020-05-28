const places_api = require("./places_api.js");
const helpers = require("./helpers.js");
const db = require("./db.js");
const score = require("./score.js");

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
    return botContext.translate("ERR_UNKNOWN_CITY", {
      lastLetter: botContext.sessions[botContext.chatID].lastLetter.toUpperCase(),
    });
  }
  return null;
}

async function checkCityInDB(botContext, letter) {
  if (letter !== botContext.text[0]) {
    return botContext.translate("ERR_CITY_ON_LETTER", { letter: letter.toUpperCase() });
  }

  if (botContext.sessions[botContext.chatID].spentCities.includes(botContext.text)) {
    return botContext.translate("ERR_THIS_IS_SPENT_CITY");
  }

  const checkCityInGoogleResult = await checkCityInGoogle(botContext);
  if (checkCityInGoogleResult !== null) {
    return checkCityInGoogleResult;
  }
  return null;
}

async function selectCityByLetter(botContext, letter) {
  const findCities = await places_api.findCitiesByLetter(
    botContext,
    botContext.translate("CITY", { letter: letter })
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
    await db.saveProgressToFile(botContext.sessions);
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));

    return result;
  } else {
    result.messages.push(botContext.translate("ERR_SELECT_CITY"));
    return result;
  }
}

async function processEnteredCity(botContext) {
  const result = { messages: [], errorMsg: "" };
  const checkCityInDBResult = await checkCityInDB(
    botContext,
    botContext.sessions[botContext.chatID].lastLetter
  );
  if (checkCityInDBResult !== null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  botContext.sessions[botContext.chatID].spentCities.push(botContext.text);
  botContext.sessions[botContext.chatID].scoreInSession++;
  if (botContext.sessions[botContext.chatID].scoreInSession > botContext.highScore) {
    result.messages.push(
      botContext.translate("NEW_RECORD", {
        scoreInSession: botContext.sessions[botContext.chatID].scoreInSession,
      })
    );
  }
  await score.processScore(botContext);
  await db.saveProgressToFile(botContext.sessions);

  const selectedCity = await selectCityByLetter(
    botContext,
    lastValidLetter(botContext.text, botContext)
  );

  if (selectedCity === null || selectedCity === undefined) {
    result.messages.push(
      botContext.translate("LOOSE_BOT", {
        spentCities: [...botContext.sessions[botContext.chatID].spentCities].join(", "),
        scoreInSession: botContext.sessions[botContext.chatID].scoreInSession,
        highScore: botContext.highScore,
      })
    );
    result.messages.push(botContext.translate("LETS_PLAY_AGAIN"));
    return result;
  } else {
    botContext.sessions[botContext.chatID].spentCities.push(selectedCity);
    botContext.sessions[botContext.chatID].lastLetter = lastValidLetter(selectedCity, botContext);
    await db.saveProgressToFile(botContext.sessions);

    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
}

module.exports = {
  start,
  processEnteredCity,
};
