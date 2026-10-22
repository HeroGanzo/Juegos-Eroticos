import type { Metadata } from "next";
import type { ReactNode } from "react";
import { eq, sql } from "drizzle-orm";
import { AdminNav } from "@/components/admin/AdminNav";
import { db } from "@/db";
import { contactMessages, vipRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Panel de control", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireAdmin();
  const settings = await getSettings();
  const [[pending], [unread]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(vipRequests).where(eq(vipRequests.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(contactMessages).where(eq(contactMessages.read, false)),
  ]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <AdminNav siteTitle={settings.siteTitle} username={viewer.user.username} badges={{ vip: pending?.n ?? 0, mensajes: unread?.n ?? 0 }} />
      <div className="min-w-0">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
