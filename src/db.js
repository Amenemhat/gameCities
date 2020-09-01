const fs = require("fs");
const progressFile = "./progress.json";

const { PrismaClient } = require("@prisma/client");

async function createSessionInDB(data) {
  const gameCitiesDB = new PrismaClient();
  console.log(data);
  const createSession = async () => {
    return await gameCitiesDB.sessions.create(data);
  };

  createSession()
    .catch((e) => {
      throw e;
    })
    .then((res) => {
      console.log(res);
    })
    .finally(async () => {
      await gameCitiesDB.$disconnect();
    });
}

async function getSessions() {
  const gameCitiesDB = new PrismaClient();

  const getAllSessions = async () => {
    return await gameCitiesDB.sessions.findMany();
  };

  getAllSessions()
    .catch((e) => {
      throw e;
    })
    .then((res) => {
      console.log(res);
    })
    .finally(async () => {
      await gameCitiesDB.$disconnect();
    });
}

async function createBotContextInDB(data) {
  const gameCitiesDB = new PrismaClient();

  const createBotContext = async () => {
    return await gameCitiesDB.botContext.create(data);
  };

  createBotContext()
    .catch((e) => {
      throw e;
    })
    .then((res) => {
      console.log(res);
    })
    .finally(async () => {
      await gameCitiesDB.$disconnect();
    });
}

async function getBotContextInDB() {
  const gameCitiesDB = new PrismaClient();

  const getBotContext = async () => {
    return await gameCitiesDB.botContext.findMany();
  };

  getBotContext()
    .catch((e) => {
      throw e;
    })
    .then((res) => {
      console.log(res);
    })
    .finally(async () => {
      await gameCitiesDB.$disconnect();
    });
}

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
  createBotContextInDB,
  getBotContextInDB,
  getSessions,
  createSessionInDB,
  readProgressFromFile,
  saveProgressToFile,
  makeSession,
  deleteSession,
};
