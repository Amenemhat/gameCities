require("dotenv").config();
let https = require("https");

let findCities = [];

let input = "города Украины";
let inputtype = "textquery";
let language = "ru";

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY env variable is missing");
}
let result;
let url =
  "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?" +
  "key=" +
  process.env.GOOGLE_MAPS_API_KEY +
  "&input=" +
  input +
  "&inputtype=" +
  inputtype +
  "&language=" +
  language;

function getDataFromUrl(url) {
  let dataOut = {};
  console.log(url);
  https
    .get(url, res => {
      //console.log("statusCode:", res.statusCode);
      //console.log("headers:", res.headers);

      res.on("data", d => {
        //process.stdout.write(d);
        //result = JSON.parse(d);
        //result.data = d;
        //console.log("typeof d: " + typeof d);
        let result = JSON.stringify(d + "");
        console.log("typeof result: " + typeof result);
        //console.log("result: " + res);
        dataOut = JSON.parse(result);
        console.log("typeof dataOut: " + typeof dataOut);
        console.log("dataOut: " + JSON.parse(dataOut).candidates);
        //console.log("console.log " + result.data);
      });
    })
    .on("error", function(e) {
      console.log("Got error: " + e.message);
    });
}
//console.log("console.log " + result.data);
result = getDataFromUrl(url);
console.log("result2: " + result);
