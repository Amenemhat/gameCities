require("dotenv").config();
const Client = require("@googlemaps/google-maps-services-js").Client;
const client = new Client({});
let findCities = [];

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
}

client
  .findPlaceFromText({
    params: {
      key: process.env.GOOGLE_MAPS_API_KEY,
      input: "города Украины",
      inputtype: "textquery"
      //language: "ru"
    },
    timeout: 1000
  })
  .then(response => {
    //console.log("=====1=====");
    parseResults(response.data.candidates);
  })
  .catch(e => {
    console.log(e);
  });

function parseResults(findResults) {
  findResults.forEach(respItem => {
    client
      .placeDetails({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          place_id: respItem.place_id,
          language: "ru"
        },
        timeout: 1000
      })
      .then(resp => {
        if (resp.data.result.name) {
          findCities.push(resp.data.result.name);
          console.log(resp.data.result.name);
        }

        //console.log(resp.data || "");
      })
      .catch(e => {
        console.log("");
      });
  });
}
//console.log(findCities);
