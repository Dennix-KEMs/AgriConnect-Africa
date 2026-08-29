require("dotenv").config();

module.exports = {
  env: process.env.MPESA_ENV,

  consumerKey: process.env.MPESA_CONSUMER_KEY,

  consumerSecret: process.env.MPESA_CONSUMER_SECRET,

  shortcode: process.env.MPESA_SHORTCODE,

  passkey: process.env.MPESA_PASSKEY,

  callbackUrl: process.env.MPESA_CALLBACK_URL,

  stkUrl: process.env.MPESA_STK_URL,

  authUrl: process.env.MPESA_AUTH_URL,
};