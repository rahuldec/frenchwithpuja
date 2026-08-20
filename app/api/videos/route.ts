import { NextResponse } from "next/server";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSda-Fv3mJNwnkrk-TvirEYtCmmhqWk2FIh10kp-uZoxaypG6Mq4ZiO40Gjj2_tkwcakLq3v7L5Yfpk/pub?gid=0&single=true&output=csv";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Video = {
  topic: string;
  link: string;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value.trim());
  return values;
}

function parseCsv(text: string): Video[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length <= 1) return [];

  return lines
    .slice(1)
    .map((line) => {
      const [topic = "", link = ""] = parseCsvLine(line);
      return { topic, link };
    })
    .filter(
      (video) =>
        video.topic &&
        video.link &&
        /^https?:\/\//i.test(video.link),
    );
}

export async function GET() {
  try {
    // Google Sheets' published CSV can be cached even when the sheet has changed.
    // Add a cache-busting query parameter so every portal refresh requests the
    // latest published CSV instead of a previously cached response.
    const sheetUrl = `${SHEET_CSV_URL}&_=${Date.now()}`;

    const response = await fetch(sheetUrl, {
      cache: "no-store",
      headers: { Accept: "text/csv" },
    });

    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}.`);
    }

    const csv = await response.text();
    const videos = parseCsv(csv);

    return NextResponse.json(
      { videos },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Unable to load recordings", error);

    return NextResponse.json(
      {
        videos: [],
        error: "Recordings could not be loaded. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
