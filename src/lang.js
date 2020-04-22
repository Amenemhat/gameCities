const fs = require("fs");
const langFileRu = "./lang_ru.json";
const langFileEn = "./lang_en.json";
const defaultLanguage = "en";

async function readLang(language = defaultLanguage) {
  if (language === "ru") {
    return await readLangFile(langFileRu);
  } else {
    return await readLangFile(langFileEn);
  }
}

function readLangFile(jsonFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(jsonFile, "utf8", function (err, data) {
      if (err) {
        reject(err);
      } else {
        if (data === "") {
          resolve({});
        } else {
          resolve(
            JSON.parse(data, function (key, value) {
              if (key === "commands") {
                return regexpFromObj(value);
              }
              return value;
            })
          );
        }
      }
    });
  });
}

function regexpFromObj(obj) {
  const result = {};
  for (const key in obj) {
    result[key] = new RegExp(obj[key], "i");
  }
  return result;
}

module.exports = { readLang };
