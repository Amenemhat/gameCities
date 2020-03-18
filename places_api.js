require("dotenv").config();
const Client = require("@googlemaps/google-maps-services-js").Client;
const client = new Client({});
let foundCity = [];

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
}

function findCities(query) {
  foundCity.length = 0;
  client
    .findPlaceFromText({
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
        input: query,
        inputtype: "textquery",
        fields: ["name"],
        language: "ru"
      },
      timeout: 1000
    })
    .then(response => {
      response.data.candidates.forEach(item =>
        foundCity.push(item.name.toLowerCase())
      );
      console.log(foundCity.length);
      console.log(foundCity);
    })
    .catch(e => {
      console.log(e);
    });
}

module.exports = { findCities, foundCity };
