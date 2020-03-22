require("dotenv").config();
const Client = require("@googlemaps/google-maps-services-js").Client;
const client = new Client({});

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
}

function findCities(query) {
  return client
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
      if (
        response.data.status === "OK" &&
        response.data.candidates[0].name.length === query.length
      ) {
        return response.data.candidates[0].name.toLowerCase();
      } else {
        //console.log("Error: " + response.data.status);
        return response.data.status.toLowerCase();
      }
    })
    .catch(e => {
      console.log(e);
    });
}

function findCitiesByLetter(query) {
  return client
    .placeAutocomplete({
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
        input: query,
        language: "ru"
      },
      timeout: 2000
    })
    .then(response => {
      let result = [];
      if (
        response.data.status === "OK" &&
        response.data.predictions.length > 0
      ) {
        response.data.predictions.map(item =>
          result.push(item.structured_formatting.main_text.toLowerCase())
        );

        let cities = result.map(item => {
          if (item.includes("город ")) return item.slice(6);
          else return item;
        });
        return cities;
      } else {
        console.log("Error: " + response.data.status);
        return [];
      }
    })
    .catch(e => {
      console.log(e);
    });
}

module.exports = { findCities, findCitiesByLetter };
