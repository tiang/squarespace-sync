const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

class GoogleSheetsService {
  constructor() {
    const credentialsPath = path.join(__dirname, "../config/credentials.json");
    if (!fs.existsSync(credentialsPath)) {
      throw new Error("Google Sheets credentials file not found.");
    }

    const credentials = require(credentialsPath);
    const { client_email, private_key } = credentials;

    this.auth = new google.auth.JWT(
      client_email,
      null,
      private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  async writeData(spreadsheetId, sheetName, data) {
    try {
      const range = `${sheetName}!A1`;
      const resource = {
        values: data,
      };

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        resource,
      });

      console.log(`Data written to Google Sheets: ${spreadsheetId}`);
    } catch (error) {
      console.error("Error writing to Google Sheets:", error.message);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();