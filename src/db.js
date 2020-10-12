//const { table } = require("console");
const fs = require("fs");
const progressFile = "./progress.json";

const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: "123456",
    database: "game_sities_db",
  },
});

knex.schema.hasTable("users").then((exists) => {
  if (!exists) {
    return knex.schema
      .createTable("users", (table) => {
        table.increments("id").primary();
        table.integer("chatID");
        table.string("userName", 100);
        table.integer("highScore");
      })
      .then((rows) => {
        console.log(rows);
      })
      .catch((e) => {
        console.error(e);
      });
  } else {
    return knex
      .select()
      .from("users")
      .then((rows) =>
        rows.map((row) => {
          console.log(row);
        })
      )
      .catch((e) => {
        console.error(e);
      });
  }
});

knex.schema.hasTable("sessions").then((exists) => {
  if (!exists) {
    return knex.schema
      .createTable("sessions", (table) => {
        table.increments("id").primary();
        table.integer("chatID");
        table.text("spentCities");
        table.string("lastLetter", 1);
        table.integer("scoreInSession");
        table.boolean("open");
      })
      .then((rows) => {
        console.log(rows);
      })
      .catch((e) => {
        console.error(e);
      });
  } else {
    return knex
      .select()
      .from("sessions")
      .then((rows) =>
      rows.map((row) => {
        console.log(row);
      })
      )
      .catch((e) => {
        console.error(e);
      });
  }
});

knex.schema.hasColumn("sessions", "open").then((exist) => {
  if (!exist) {
    return knex.schema
      .table("sessions", (table) => {
        table.boolean("open");
      })
      .then(() =>
        knex("sessions").insert({
          chatID: 1234123,
          spentCities: "Харьков, Воронеж, Житомир",
          lastLetter: "р",
          scoreInSession: 3,
          open: true,
        })
      )
      .then((rows) => {
        console.log(rows);
      })
      .catch((e) => {
        console.error(e);
      });
  }
});

// knex.schema
//   .dropTableIfExists("users")
//   .then((rows) => console.log(rows))
//   .catch((e) => {
//     console.error(e);
//   });

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

async function saveProgressToDB(botContext) {
  knex.schema.hasTable("sessions").then((exists) => {
    if (exists) {
      return knex("sessions").insert({
        chatID: botContext.chatID,
        spentCities: botContext.sessions[botContext.chatID].spentCities.join(", "),
        lastLetter: botContext.sessions[botContext.chatID].lastLetter,
        scoreInSession: botContext.sessions[botContext.chatID].scoreInSession,
        open: botContext.sessions[botContext.chatID].open,
      })
        .then((rows) => {
          console.log(rows);
        })
        .catch((e) => {
          console.error(e);
        });
    } 
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
    open: true,
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
  saveProgressToDB,
  makeSession,
  deleteSession,
};
