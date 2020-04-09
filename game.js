const places_api = require("./places_api.js");
const helpers = require("./helpers.js");
const fs = require("fs");
const alphabet = "абвгдежзийклмнопрстуфхцшщыэюя";

function readProgressFromFile() {
  //console.log("readProgressFromFile");
  return new Promise((resolve, reject) => {
    fs.readFile("progress.json", "utf8", function (err, data) {
      if (err) {
        reject(err);
      } else {
        //console.log("data = " + data); //Иногда возникает ошибка
        if (data === "") {
          resolve({});
        } else {
          resolve(
            JSON.parse(data, (key, value) => {
              if (key === "spentCities") {
                return new Set(value);
              }
              return value;
            })
          );
        }
      }
    });
  });
}

function setInArr(set) {
  const arr = [];
  for (const key of set) {
    arr.push(key);
  }
  return arr;
}

function cloneToJsonObject(sessionObj) {
  const cloneObj = {};
  for (const key in sessionObj) {
    if (typeof sessionObj[key] === "object") {
      if (key === "spentCities") {
        cloneObj[key] = setInArr(sessionObj[key]);
        continue;
      }
      cloneObj[key] = cloneToJsonObject(sessionObj[key]);
    } else {
      cloneObj[key] = sessionObj[key];
    }
  }
  return cloneObj;
}

async function saveProgressToFile(sessions) {
  //console.log("saveProgressToFile");
  const sessionsJsonObj = cloneToJsonObject(sessions);
  const jsonContent = JSON.stringify(sessionsJsonObj);
  await fs.writeFile("progress.json", jsonContent, "utf8", function (err) {
    if (err) {
      throw new Error(err);
    }
  });
}

async function makeSession(chatID, sessions) {
  //console.log("makeSession");
  sessions[chatID] = { spentCities: new Set(), lastLetter: "" };
  //console.log(sessions);
  await saveProgressToFile();
  //console.log(sessions);
}

async function deleteSession(chatID, sessions) {
  //console.log("deleteSession");
  delete sessions[chatID];
  await saveProgressToFile();
  //console.log(sessions);
}

function randomCity(arrCities) {
  return arrCities[helpers.getRandomNumber(arrCities.length)];
}

function lastValidLetter(str) {
  //console.log("lastValidLetter");
  let lastLetter = str[str.length - 1];
  const invalidLetters = ["ь", "ъ"];
  let i = 2;

  while (invalidLetters.includes(lastLetter)) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
}

async function checkCityInGoogle(chatID, sessions, city) {
  //console.log("checkCityInGoogle");
  const foundCity = await places_api.findCities(city);

  if (foundCity === "over_query_limit") {
    return "Введите другой город!";
  }
  if (city !== foundCity || foundCity === "zero_results") {
    return (
      "Я такого города не знаю! \nНужно назвать город на букву " +
      sessions[chatID].lastLetter.toUpperCase()
    );
  }
  return null;
}

function checkCityInDB(chatID, sessions, city, letter) {
  //console.log("checkCityInDB");
  if (letter !== city[0]) {
    return "Нужно назвать город на букву " + letter.toUpperCase();
  }
  if (sessions[chatID].spentCities.has(city)) {
    return "Этот город уже был назван!";
  }
  return null;
}

async function selectCityByLetter(chatID, sessions, letter) {
  //console.log("selectCityByLetter");
  const findCities = await places_api.findCitiesByLetter("город " + letter);
  const result = findCities.filter(
    item => item[0] === letter && !sessions[chatID].spentCities.has(item)
  );

  if (result.length === 0) {
    return null;
  } else {
    return randomCity(result);
  }
}

async function start(chatID, sessions) {
  //console.log("start");
  //console.log(sessions);
  const result = { messages: [] };
  result.messages.push(
    "Начинаем игру. \nЯ называю город, а ты должен в ответ назвать любой город \nначинающийся на последнюю букву моего города.\nГорода не должны повторятся."
  );
  const selectedCity = await selectCityByLetter(chatID, randomCity(alphabet));

  if (selectedCity !== null && selectedCity !== undefined) {
    sessions[chatID].spentCities.add(selectedCity);
    sessions[chatID].lastLetter = lastValidLetter(selectedCity);
    saveProgressToFile();
    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    //console.log("start, sessions =");
    //console.log(sessions);

    return result;
  } else {
    result.messages.push("Ошибка выбора города!");
    return result;
  }
}

async function processEnteredCity(chatID, sessions, city) {
  //console.log("processEnteredCity");
  //console.log(sessions);
  await readProgressFromFile().then(result => {
    sessions = result;
  });
  //console.log(sessions);

  const result = { messages: [], errorMsg: "" };

  const checkCityInGoogleResult = await checkCityInGoogle(chatID, city);
  if (checkCityInGoogleResult !== null) {
    result.errorMsg = checkCityInGoogleResult;
    return result;
  }

  const checkCityInDBResult = checkCityInDB(
    chatID,
    city,
    sessions[chatID].lastLetter
  );
  if (checkCityInDBResult !== null) {
    result.errorMsg = checkCityInDBResult;
    return result;
  }

  sessions[chatID].spentCities.add(city);
  saveProgressToFile();
  //console.log("processEnteredCity spentCities.add, sessions =");
  //console.log(sessions);

  const selectedCity = await selectCityByLetter(chatID, lastValidLetter(city));
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
    saveProgressToFile();
    //console.log("processEnteredCity lastLetter, sessions =");
    //console.log(sessions);

    result.messages.push(helpers.firstSymbolToUpperCase(selectedCity));
    return result;
  }
}

module.exports = {
  readProgressFromFile,
  makeSession,
  deleteSession,
  start,
  processEnteredCity
};
