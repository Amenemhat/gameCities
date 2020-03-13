require("dotenv").config();
const Client = require("@googlemaps/google-maps-services-js").Client;
const client = new Client({});
let findCity = [];

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
}

function parseResults(city) {
  city.forEach(item => findCity.push(item.name));
  console.log(findCity.length);
  //console.log(findCity);
}

function findCities(query) {
  findCity.length = 0;
  client
    .findPlaceFromText({
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
        input: query,
        inputtype: "textquery",
        fields: ["name"],
        language: "ru"
      },
      timeout: 2000
    })
    .then(response => {
      parseResults(response.data.candidates);
    })
    .catch(e => {
      console.log(e);
    });
}

module.exports = { findCities, findCity };
