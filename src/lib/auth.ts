import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type AccessLevel, type UserRole } from "@/db/schema";
import { ACCESS_RANK } from "./constants";
import { sha256 } from "./password";

export const SESSION_COOKIE = "je_session";
const SESSION_DAYS = 30;

export type ViewerUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  vipUntil: Date | null;
  createdAt: Date;
};

export type Viewer = {
  user: ViewerUser | null;
  /** 0 = visitante, 1 = registrado, 2 = VIP, 3 = administrador */
  rank: number;
  isAdmin: boolean;
  isVip: boolean;
  isRegistered: boolean;
};

const ANON: Viewer = { user: null, rank: 0, isAdmin: false, isVip: false, isRegistered: false };

async function cookieSecurity() {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  return proto === "https"
    ? { secure: true, sameSite: "none" as const }
    : { secure: false, sameSite: "lax" as const };
}

export async function createSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  const sec = await cookieSecurity();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, path: "/", expires: expiresAt, ...sec });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }
  const sec = await cookieSecurity();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, ...sec });
}

export function isVipActive(vipUntil: Date | null | undefined): boolean {
  return !!vipUntil && vipUntil.getTime() > Date.now();
}

export const getViewer = cache(async (): Promise<Viewer> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return ANON;
  try {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        vipUntil: users.vipUntil,
        createdAt: users.createdAt,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sha256(token)))
      .limit(1);
    const row = rows[0];
    if (!row || row.expiresAt.getTime() < Date.now()) return ANON;
    const user: ViewerUser = {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      vipUntil: row.vipUntil,
      createdAt: row.createdAt,
    };
    const isAdmin = user.role === "admin";
    const isVip = isAdmin || isVipActive(user.vipUntil);
    return { user, rank: isAdmin ? 3 : isVip ? 2 : 1, isAdmin, isVip, isRegistered: true };
  } catch (err) {
    console.error("[auth] getViewer failed", err);
    return ANON;
  }
});

export function canAccess(viewer: Viewer, level: AccessLevel): boolean {
  return viewer.rank >= ACCESS_RANK[level];
}

export async function requireAdmin(): Promise<Viewer & { user: ViewerUser }> {
  const viewer = await getViewer();
  if (!viewer.isAdmin || !viewer.user) redirect("/login?next=/admin");
  return viewer as Viewer & { user: ViewerUser };
}

export async function requireUser(next = "/cuenta"): Promise<Viewer & { user: ViewerUser }> {
  const viewer = await getViewer();
  if (!viewer.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer as Viewer & { user: ViewerUser };
}
