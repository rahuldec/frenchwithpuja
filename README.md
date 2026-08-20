# French with Puja

A lightweight public video library for French class recordings.

Teachers maintain the recordings in a Google Sheet. The website reads the sheet and automatically displays the topic and recording link without requiring students to log in.

## Google Sheet format

The first row must contain:

| Topic | Video Link |
| --- | --- |
| Verbs | https://... |
| Words | https://... |

The application currently reads columns **A** and **B** from the first sheet (`Sheet1`).

## Important: publish the sheet

The site uses Google's public Visualization endpoint, so the sheet must be available publicly. In Google Sheets, use **File → Share → Publish to web** and publish the required sheet.

Do not put private student information in this spreadsheet. Publishing a sheet makes its contents accessible to anyone who can access the published data.

The recording URLs themselves must also be accessible to students without a Microsoft/Google login if the goal is completely public playback.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy to Vercel

Import `rahuldec/frenchwithpuja` into Vercel. No environment variables are required for the current setup.

The page refreshes its recording list every 60 seconds and also has a manual Refresh button.
