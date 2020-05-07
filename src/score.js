const fs = require("fs");
const scoreFile = "./score.json";

function readScoreFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(scoreFile, "utf8", function (err, data) {
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

async function saveScoreToFile(score) {
  const jsonContent = JSON.stringify(score, null, "  ");

  await fs.writeFile(scoreFile, jsonContent, "utf8", function (err) {
    if (err) {
      throw new Error(err);
    }
  });
}

module.exports = {
  readScoreFromFile,
  saveScoreToFile,
};
