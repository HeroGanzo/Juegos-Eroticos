import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { DEFAULT_SETTINGS, normalizeSettings, type SiteSettings } from "./constants";
import { getDbStatus } from "./db-status";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const status = await getDbStatus();
  if (!status.ok) return DEFAULT_SETTINGS;
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    return normalizeSettings(rows[0]?.data ?? {});
  } catch (err) {
    console.error("[settings] usando valores por defecto:", err);
    return DEFAULT_SETTINGS;
  }
});
