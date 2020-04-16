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
      throw new Error(err);
    }
  });
}

async function makeSession(sessions, chatID) {
  sessions[chatID] = { spentCities: [], lastLetter: "" };
  await saveProgressToFile(sessions);
  return sessions;
}

async function deleteSession(chatID, sessions) {
  delete sessions[chatID];
  await saveProgressToFile(sessions);
}

module.exports = {
  readProgressFromFile,
  saveProgressToFile,
  makeSession,
  deleteSession,
};
