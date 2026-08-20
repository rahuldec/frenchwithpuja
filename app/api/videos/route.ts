import { NextResponse } from "next/server";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSda-Fv3mJNwnkrk-TvirEYtCmmhqWk2FIh10kp-uZoxaypG6Mq4ZiO40Gjj2_tkwcakLq3v7L5Yfpk/pub?gid=0&single=true&output=csv";

const SHEET_HTML_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSda-Fv3mJNwnkrk-TvirEYtCmmhqWk2FIh10kp-uZoxaypG6Mq4ZiO40Gjj2_tkwcakLq3v7L5Yfpk/pubhtml?gid=0&single=true";

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

// When a teacher inserts a hyperlink and gives it a friendly filename,
// Google's CSV export can contain only the visible filename instead of the
// underlying URL. The published HTML still contains the real href, so use it
// as a fallback and pair each row's topic with its linked recording.
function parsePublishedHtml(text: string): Video[] {
  const videos: Video[] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of text.matchAll(rowPattern)) {
    const row = rowMatch[1];
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (match) => match[1],
    );

    if (cells.length < 2) continue;

    const topic = cells[0].replace(/<[^>]+>/g, "").trim();
    const linkMatch = cells[1].match(/href=["']([^"']+)["']/i);
    const link = linkMatch?.[1] || "";

    if (topic && /^https?:\/\//i.test(link)) {
      videos.push({ topic, link: link.replace(/&amp;/g, "&") });
    }
  }

  return videos;
}

export async function GET() {
  try {
    const cacheBust = Date.now();
    const csvResponse = await fetch(`${SHEET_CSV_URL}&_=${cacheBust}`, {
      cache: "no-store",
      headers: { Accept: "text/csv" },
    });

    if (!csvResponse.ok) {
      throw new Error(`Google Sheets returned ${csvResponse.status}.`);
    }

    const csv = await csvResponse.text();
    let videos = parseCsv(csv);

    // Hyperlinked cells can export their display text (for example an .mp4
    // filename) instead of the actual URL. Fall back to published HTML.
    if (videos.length === 0) {
      const htmlResponse = await fetch(`${SHEET_HTML_URL}&_=${cacheBust}`, {
        cache: "no-store",
        headers: { Accept: "text/html" },
      });

      if (htmlResponse.ok) {
        videos = parsePublishedHtml(await htmlResponse.text());
      }
    }

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
