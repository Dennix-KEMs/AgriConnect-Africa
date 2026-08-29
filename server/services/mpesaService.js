const axios = require("axios");
const mpesa = require("../config/mpesa");

async function getAccessToken() {
  try {
    const auth = Buffer.from(
      `${mpesa.consumerKey}:${mpesa.consumerSecret}`
    ).toString("base64");

    const response = await axios.get(
      mpesa.authUrl,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;

  } catch (error) {

    console.error(
      "M-Pesa Token Error:",
      error.response?.data || error.message
    );

    throw error;
  }
}

function generateTimestamp() {

  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  const seconds = String(
    date.getSeconds()
  ).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generatePassword(timestamp) {

  return Buffer.from(
    `${mpesa.shortcode}${mpesa.passkey}${timestamp}`
  ).toString("base64");
}

async function stkPush({

    phone,

    amount,

    accountReference,

    transactionDesc

}) {

    const accessToken =
        await getAccessToken();

    const timestamp =
        generateTimestamp();

    const password =
        generatePassword(timestamp);

    const response =
        await axios.post(

            mpesa.stkUrl,

            {

                BusinessShortCode:
                    mpesa.shortcode,

                Password:
                    password,

                Timestamp:
                    timestamp,

                TransactionType:
                    "CustomerPayBillOnline",

                Amount:
                    amount,

                PartyA:
                    phone,

                PartyB:
                    mpesa.shortcode,

                PhoneNumber:
                    phone,

                CallBackURL:
                    mpesa.callbackUrl,

                AccountReference:
                    accountReference,

                TransactionDesc:
                    transactionDesc

            },

            {

                headers:{

                    Authorization:
                        `Bearer ${accessToken}`

                }

            }

        );

    return response.data;

}

module.exports = {

    getAccessToken,

    generateTimestamp,

    generatePassword,

    stkPush

};