let game = require("./game.js");
let session = new game.session(12345);

console.log(session);
console.log(session.spentCities.add("2Donetsk"));
console.log(session);
