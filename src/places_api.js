require("dotenv").config();
const Client = require("@googlemaps/google-maps-services-js").Client;
const client = new Client({});
const i18n = require("i18n");

i18n.configure({
  locales: ["en", "ru"],
  directory: "locales",
});

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
}

if (!process.env.GOOGLE_MAPS_API_KEY2) {
  throw new Error("GOOGLE_MAPS_API_KEY2 env variable is missing");
}

function findCities(query, langCode) {
  return client
    .findPlaceFromText({
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY2,
        input: query,
        inputtype: "textquery",
        fields: ["name"],
        language: langCode,
      },
      timeout: 2000,
    })
    .then((response) => {
      if (
        response.data.status === "OK" &&
        response.data.candidates[0].name.length === query.length
      ) {
        return response.data.candidates[0].name.toLowerCase();
      } else {
        return response.data.status.toLowerCase();
      }
    });
}

async function findCitiesByLetter(query, langCode) {
  i18n.setLocale(langCode);
  return client
    .placeAutocomplete({
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
        input: query,
        types: "(cities)",
        language: langCode,
      },
      timeout: 2000,
    })
    .then((response) => {
      const result = [];
      if (response.data.status === "OK" && response.data.predictions.length > 0) {
        response.data.predictions.map((item) =>
          result.push(item.structured_formatting.main_text.toLowerCase())
        );

        const cities = result.map((item) => {
          if (item.includes(i18n.__("CITY"))) return item.slice(i18n.__("CITY").length);
          else {
            return item;
          }
        });
        return cities;
      } else {
        return [];
      }
    });
}

module.exports = { findCities, findCitiesByLetter };
