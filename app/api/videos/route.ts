import { NextResponse } from "next/server";

const SHEET_ID = "1YfxnKXRMKJ8VtiWKtAYleXUXcu-3KV7FQ1rTbr4cvCw";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Video = {
  topic: string;
  link: string;
};

function parseGoogleVisualizationResponse(text: string): Video[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Unexpected Google Sheets response.");
  }

  const payload = JSON.parse(text.slice(start, end + 1));
  const rows = payload?.table?.rows ?? [];

  return rows
    .map((row: { c?: Array<{ v?: unknown } | null> }) => {
      const topic = String(row?.c?.[0]?.v ?? "").trim();
      const link = String(row?.c?.[1]?.v ?? "").trim();
      return { topic, link };
    })
    .filter((video: Video) => video.topic && video.link && /^https?:\/\//i.test(video.link));
}

export async function GET() {
  const query = encodeURIComponent("select A,B where A is not null and B is not null");
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=${query}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "text/plain" },
    });

    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}.`);
    }

    const text = await response.text();
    const videos = parseGoogleVisualizationResponse(text);

    return NextResponse.json(
      { videos },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
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
