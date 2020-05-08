const fs = require("fs");
const progressFile = "./progress.json";

function readProgressFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(progressFile, "utf8", function (err, data) {
      if (err) {
        reject(err);
      } else {
        if (data === "") {
          resolve({});
        } else {
          resolve(JSON.parse(data));
        }
      }
    });
  });
}

async function saveProgressToFile(sessions) {
  const jsonContent = JSON.stringify(sessions, null, "  ");

  await fs.writeFile(progressFile, jsonContent, "utf8", function (err) {
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
  await saveProgressToFile(botContext.sessions);
  return botContext.sessions;
}

async function deleteSession(botContext) {
  delete botContext.sessions[botContext.chatID];
  await saveProgressToFile(botContext.sessions);
}

module.exports = {
  readProgressFromFile,
  saveProgressToFile,
  makeSession,
  deleteSession,
};
