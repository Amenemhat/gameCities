const fs = require("fs");
const progressFile = "./progress.json";

async function readProgressFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(progressFile, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      if (data === "") {
        resolve({});
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

async function saveProgressToFile(botContext) {
  const jsonContent = JSON.stringify(botContext.sessions, null, "  ");

  fs.writeFile(progressFile, jsonContent, "utf8", function (err) {
    if (err) {
      throw new Error("Ошибка: " + err);
    }
  });
}

async function makeSession(botContext) {
  botContext.sessions[botContext.chatID] = {
    spentCities: [],
    lastLetter: "",
    scoreInSession: 0,
  };
  await saveProgressToFile(botContext);
}

async function deleteSession(botContext) {
  delete botContext.sessions[botContext.chatID];
  await saveProgressToFile(botContext);
}

module.exports = {
  readProgressFromFile,
  saveProgressToFile,
  makeSession,
  deleteSession,
};
