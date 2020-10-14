if (
  !process.env.PG_HOST ||
  !process.env.PG_USER ||
  !process.env.PG_PASSWORD ||
  !process.env.PG_DATABASE
) {
  throw new Error("Database connection env variable is missing!");
}

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  },
});

knex.schema
  .hasTable("users")
  .then((exists) => {
    if (!exists) {
      return knex.schema
        .createTable("users", (table) => {
          table.increments("id").primary();
          table.integer("chatID").unique();
          table.string("userName", 100);
          table.integer("highScore");
        })
        .then((rows) => {
          console.log(rows);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  })
  .then(() => {
    knex.schema.hasTable("sessions").then((exists) => {
      if (!exists) {
        return knex.schema
          .createTable("sessions", (table) => {
            table.integer("userID").unsigned().references("users.id");
            table.text("spentCities");
            table.string("lastLetter", 1);
            table.integer("scoreInSession");
          })
          .then((rows) => {
            console.log(rows);
          })
          .catch((e) => {
            console.error(e);
          });
      }
    });
  });

async function readProgressFromDB(chatID, userName) {
  return knex
    .select()
    .from("users")
    .where("chatID", chatID)
    .then((usersRows) => {
      if (usersRows[0]) {
        return knex
          .select("spentCities", "lastLetter", "scoreInSession")
          .from("sessions")
          .where("userID", usersRows[0].id)
          .then((sessionsRows) => {
            if (sessionsRows[0]) {
              return {
                [chatID]: {
                  spentCities: sessionsRows[0].spentCities.split(", "),
                  lastLetter: sessionsRows[0].lastLetter,
                  scoreInSession: sessionsRows[0].scoreInSession,
                },
              };
            } else {
              return {};
            }
          });
      } else {
        return knex("users")
          .insert({ chatID: chatID, userName: userName, highScore: 0 })
          .then(() => {
            return {};
          })
          .catch((e) => {
            console.error(e);
          });
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

async function saveProgressToDB(botContext) {
  await knex
    .select()
    .from("users")
    .where("chatID", botContext.chatID)
    .then((usersRows) => {
      if (usersRows[0]) {
        return knex("sessions")
          .update({
            spentCities: botContext.sessions[botContext.chatID].spentCities.join(", "),
            lastLetter: botContext.sessions[botContext.chatID].lastLetter,
            scoreInSession: botContext.sessions[botContext.chatID].scoreInSession,
          })
          .where("userID", usersRows[0].id)
          .catch((e) => {
            console.error(e);
          });
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

async function makeSession(botContext) {
  botContext.sessions[botContext.chatID] = {
    spentCities: [],
    lastLetter: "",
    scoreInSession: 0,
  };

  await knex
    .select()
    .from("users")
    .where("chatID", botContext.chatID)
    .then((usersRows) => {
      if (usersRows[0]) {
        return knex("sessions")
          .insert({
            userID: usersRows[0].id,
            spentCities: "",
            lastLetter: "",
            scoreInSession: 0,
          })
          .catch((e) => {
            console.error(e);
          });
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

async function deleteSession(botContext) {
  delete botContext.sessions[botContext.chatID];
  await knex
    .select()
    .from("users")
    .where("chatID", botContext.chatID)
    .then((usersRows) => {
      if (usersRows[0]) {
        return knex("sessions")
          .del()
          .where("userID", usersRows[0].id)
          .catch((e) => {
            console.error(e);
          });
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

async function readScoreFromDB(botContext) {
  await knex("users")
    .select("userName", "highScore")
    .where("chatID", botContext.chatID)
    .then((rows) => {
      botContext.highScore = rows[0].highScore;
    })
    .catch((e) => {
      console.error(e);
    });
}

async function saveScoreToDB(botContext) {
  await knex("users")
    .update({ highScore: botContext.highScore })
    .where("chatID", botContext.chatID)
    .catch((e) => {
      console.error(e);
    });
}

async function getTopScores(count) {
  return knex("users")
    .select("highScore", "userName")
    .orderBy("highScore", "desc")
    .limit(count)
    .catch((e) => {
      console.error(e);
    });
}

module.exports = {
  readProgressFromDB,
  saveProgressToDB,
  makeSession,
  deleteSession,
  readScoreFromDB,
  saveScoreToDB,
  getTopScores,
};
