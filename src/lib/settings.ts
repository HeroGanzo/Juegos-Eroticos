import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { DEFAULT_SETTINGS, normalizeSettings, type SiteSettings } from "./constants";
import { ensureSeeded } from "./seed";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    return normalizeSettings(rows[0]?.data ?? {});
  } catch (err) {
    console.error("[settings] using defaults:", err);
    return DEFAULT_SETTINGS;
  }
});
