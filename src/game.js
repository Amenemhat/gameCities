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

async function checkCityInDB(botContext, letter) {
  if (letter !== botContext.text[0]) {
    return botContext.translate("ERR_CITY_ON_LETTER", { letter: letter.toUpperCase() });
  }
  if (botContext.sessions[botContext.chatID].spentCities.includes(botContext.text)) {
    return botContext.translate("ERR_THIS_IS_SPENT_CITY");
  }

  const { foundCities, status } = await places_api.findCitiesBy(
    botContext,
    botContext.translate("CITY", { letter: botContext.text })
  );
  if (
    status === "OK" &&
    foundCities.length > 0 &&
    foundCities[0].toLowerCase() === botContext.text.toLowerCase()
  ) {
    return "OK";
  }
  if (status === "OVER_QUERY_LIMIT") {
    return botContext.translate("ERR_ENTER_ANOTHER_CITY");
  }
  return botContext.translate("ERR_UNKNOWN_CITY", {
    lastLetter: letter.toUpperCase(),
  });
}

async function selectCityByLetter(botContext, letter) {
  const { foundCities, status } = await places_api.findCitiesBy(
    botContext,
    botContext.translate("CITY", { letter: letter })
  );
  if (status === "OK" && foundCities.length > 0) {
    const result = foundCities.filter(
      (item) =>
        item[0] === letter && !botContext.sessions[botContext.chatID].spentCities.includes(item)
    );
    return randomCity(result);
  } else {
    return null;
  }
}

async function start(botContext) {
  const selectedCity = await selectCityByLetter(
    botContext,
    randomCity(botContext.translate("ALPHABET"))
  );
  const result = { messages: [] };
  result.messages.push(botContext.translate("START_GAME"));

  if (selectedCity !== null) {
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
  if (checkCityInDBResult !== "OK") {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  botContext.sessions[botContext.chatID].spentCities.push(botContext.text);
  botContext.sessions[botContext.chatID].scoreInSession++;
  await score.getHighScore(botContext);
  if (botContext.sessions[botContext.chatID].scoreInSession > botContext.highScore) {
    await score.processScore(botContext);
    result.messages.push(
      botContext.translate("NEW_RECORD", {
        scoreInSession: botContext.sessions[botContext.chatID].scoreInSession,
      })
    );
  }
  await db.saveProgressToFile(botContext.sessions);

  const selectedCity = await selectCityByLetter(
    botContext,
    lastValidLetter(botContext.text, botContext)
  );

  if (selectedCity === null) {
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
