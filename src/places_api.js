require("dotenv").config();
const helpers = require("./helpers.js");
const Client = require("@googlemaps/google-maps-services-js").Client;
const client = new Client({});

function getGoogleApiKey() {
  const keys = [
    process.env.GOOGLE_MAPS_API_KEY0,
    process.env.GOOGLE_MAPS_API_KEY1,
    process.env.GOOGLE_MAPS_API_KEY2,
    process.env.GOOGLE_MAPS_API_KEY3,
    process.env.GOOGLE_MAPS_API_KEY4,
    process.env.GOOGLE_MAPS_API_KEY5,
    process.env.GOOGLE_MAPS_API_KEY6,
  ];
  const key = keys[helpers.getRandomNumber(6)];

  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
  } else {
    return key;
  }
}

async function findCitiesBy(botContext, query = "") {
  return client
    .placeAutocomplete({
      params: {
        key: getGoogleApiKey(),
        input: query,
        types: "(cities)",
        language: botContext.lang,
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
          if (item.includes(botContext.translate("CITY")))
            return item.slice(botContext.translate("CITY").length);
          else {
            return item;
          }
        });
        return { foundCities: cities, status: response.data.status };
      } else {
        return { foundCities: [], status: response.data.status };
      }
    });
}

module.exports = { findCitiesBy };
