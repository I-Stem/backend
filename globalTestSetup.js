exports.mochaGlobalSetup = function() {
const result = require("dotenv").config({path: ".env.test"});
console.log("starting env import");
console.log(result);
}