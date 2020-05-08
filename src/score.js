const fs = require("fs");
const scoreFile = "./score.json";

async function processScore(botContext) {
  const score = botContext.sessions[botContext.chatID].scoreInSession;
  const scoreBoard = await readScoreFromFile();

  if (botContext.chatID in scoreBoard) {
    if (score > scoreBoard[botContext.chatID].hiScore) {
      scoreBoard[botContext.chatID].hiScore = score;
      botContext.sessions[botContext.chatID].hiScore = score;
    }
  } else {
    scoreBoard[botContext.chatID] = { hiScore: score };
    botContext.sessions[botContext.chatID].hiScore = score;
  }
  await saveScoreToFile(scoreBoard);
}

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
  processScore,
};
