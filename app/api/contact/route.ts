import { Resend } from "resend";
import { NextResponse } from "next/server";
import { isEmail } from "@/lib/contact";
import { contactEmailHtml, oneLine } from "@/lib/contactEmail";

// Created on first use, not at import: the build imports this module to
// collect route data, and Resend throws without an API key.
let resend: Resend | null = null;
const CONTACT_SECRET = process.env.CONTACT_SECRET ?? "hk-site-origin";

// In-memory rate limiter: 3 submissions per IP per 15 minutes
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const ipSubmissions = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, website, formOpenedAt } =
      await request.json();

    // Honeypot: bots fill this hidden field, humans never see it
    if (website) {
      return NextResponse.json({ success: true });
    }

    // Timing check: reject submissions faster than 2 seconds (bots are instant)
    if (typeof formOpenedAt === "number" && Date.now() - formOpenedAt < 2000) {
      return NextResponse.json({ success: true });
    }

    // Rate limiting
    const ip = getClientIp(request);
    const now = Date.now();
    const record = ipSubmissions.get(ip);
    if (record && now < record.resetAt) {
      if (record.count >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Too many submissions. Please try again later." },
          { status: 429 }
        );
      }
      record.count++;
    } else {
      ipSubmissions.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }

    // Anything but a non-empty string (a number, an array, an object) is rejected
    // here rather than stringified into the email.
    const fields = [name, email, subject, message];
    if (!fields.every((f) => typeof f === "string" && f.trim())) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    resend ??= new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Website Contact <onboarding@resend.dev>",
      to: "kanaskiehenry@gmail.com",
      subject: `[Website] ${oneLine(subject)}`,
      replyTo: email,
      html: contactEmailHtml({ name, email, subject, message }, CONTACT_SECRET),
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to send email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
