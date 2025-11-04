const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CREDENTIALS_PATH = path.join(__dirname, "../config/credentials.json");
const TOKEN_PATH = path.join(__dirname, "../config/token.json");

async function getAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
  } else {
    throw new Error("Google Calendar token missing — run OAuth setup");
  }

  return oAuth2Client;
}

async function createCalendarEvent({
  summary,
  description,
  start,
  end,
  attendees,
}) {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary,
    description,
    start: { dateTime: start, timeZone: "Asia/Kolkata" },
    end: { dateTime: end, timeZone: "Asia/Kolkata" },
    attendees: attendees.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: Date.now().toString(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  return data;
}

module.exports = { createCalendarEvent };
