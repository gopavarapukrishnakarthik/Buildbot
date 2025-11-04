// utils/googleAuthSetup.js
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CREDENTIALS_PATH = path.join(__dirname, "../config/credentials.json");
const TOKEN_PATH = path.join(__dirname, "../config/token.json");

async function main() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const cred = credentials.installed || credentials.web;
  const { client_secret, client_id, redirect_uris } = cred;
  const redirectUri =
    (redirect_uris && redirect_uris.length > 0 && redirect_uris[0]) ||
    "http://localhost"; // fallback
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this URL:", authUrl);

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question("Enter the code from that page here: ", async (code) => {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("Token stored to", TOKEN_PATH);
    readline.close();
  });
}

main();
