const fs = require("fs");
const scoreFile = "./score.json";

async function processScore(botContext) {
  const score = botContext.sessions[botContext.chatID].scoreInSession;
  const scoreBoard = await readScoreFromFile();

  if (botContext.chatID in scoreBoard) {
    if (score > scoreBoard[botContext.chatID].highScore) {
      scoreBoard[botContext.chatID].highScore = score;
      botContext.highScore = score;
    }
  } else {
    scoreBoard[botContext.chatID] = { highScore: score, userName: botContext.userName };
    botContext.highScore = score;
  }
  await saveScoreToFile(scoreBoard);
}

async function getHighScore(botContext) {
  const scoreBoard = await readScoreFromFile();
  if (botContext.chatID in scoreBoard) {
    botContext.highScore = scoreBoard[botContext.chatID].highScore;
  } else {
    scoreBoard[botContext.chatID] = { highScore: 0, userName: botContext.userName };
    await saveScoreToFile(scoreBoard);
  }
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
  readScoreFromFile,
  getHighScore,
};
