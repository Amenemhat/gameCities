require("dotenv").config();
const Client = require("@googlemaps/google-maps-services-js").Client;
const client = new Client({});

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
}

function findCities(query) {
  return (
    client
      .placeAutocomplete({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          input: query,
          language: "ru"
        },
        timeout: 1000
      })
      /*.findPlaceFromText({
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
        input: query,
        inputtype: "textquery",
        fields: ["name"],
        language: "ru"
      },
      timeout: 1000
    })*/
      .then(response => {
        //console.log(response.data);
        if (
          response.data.status === "OK" &&
          response.data.predictions[0].structured_formatting
            .main_text_matched_substrings[0].length === query.length
        ) {
          return response.data.predictions[0].structured_formatting.main_text;
        } else {
          return response.data.status;
        }
      })
      .catch(e => {
        console.log(e);
      })
  );
}

module.exports = { findCities };
