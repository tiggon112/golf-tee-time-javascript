require("dotenv").config();

const apiKey = process.env.API_KEY;
const apiURL = process.env.API_URL || "test";
console.log(apiKey);
console.log(apiURL);
const courses = process.env.BOOKING_COURSE;
console.log(courses.split(","));
