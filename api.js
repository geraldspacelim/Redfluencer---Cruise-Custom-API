require("dotenv").config();
const axios = require("axios").default;

const fcm = axios.create({
  baseURL: "https://fcm.googleapis.com/",
  headers: {
    "Content-Type": "application/json,text/plain, */*",
    Authorization: `key=${process.env.SERVER_KEY}`,
  },
});

exports.fcm = fcm;
