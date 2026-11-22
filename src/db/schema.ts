import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export type AccessLevel = "public" | "registered" | "vip";
export type UserRole = "user" | "admin";
export type PostStatus = "published" | "draft";
export type PageType = "content" | "games" | "wishlist" | "categories" | "about" | "contact" | "vip" | "link";
export type MenuSection = "header" | "footer" | "both" | "none";
export type VipRequestStatus = "pending" | "approved" | "rejected";

export type DownloadLinkAccess = "common" | "vip";

export type DownloadLink = {
  label: string;
  url: string;
  platform: string;
  size: string;
  /** "common" = visible para quien puede ver la publicación; "vip" = solo VIP/admin. */
  access?: DownloadLinkAccess;
};

export type PageFilters = {
  category?: string;
  platform?: string;
  postType?: string;
  access?: string;
  sort?: string;
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("user"),
  vipUntil: timestamp("vip_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("#ec4899"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const postTypes = pgTable("post_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull().default("🎮"),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  postTypeId: integer("post_type_id").references(() => postTypes.id, { onDelete: "set null" }),
  primaryCategoryId: integer("primary_category_id").references(() => categories.id, { onDelete: "set null" }),
  excerpt: text("excerpt").notNull().default(""),
  description: text("description").notNull().default(""),
  rating: real("rating").notNull().default(0),
  coverImage: text("cover_image").notNull().default(""),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  videoUrl: text("video_url").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  downloadLinks: jsonb("download_links").$type<DownloadLink[]>().notNull().default([]),
  platforms: jsonb("platforms").$type<string[]>().notNull().default([]),
  accessLevel: text("access_level").$type<AccessLevel>().notNull().default("public"),
  version: text("version").notNull().default(""),
  developer: text("developer").notNull().default(""),
  language: text("language").notNull().default(""),
  fileSize: text("file_size").notNull().default(""),
  status: text("status").$type<PostStatus>().notNull().default("published"),
  featured: boolean("featured").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const postCategories = pgTable(
  "post_categories",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.categoryId] })],
);

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").$type<PageType>().notNull().default("content"),
  content: text("content").notNull().default(""),
  accessLevel: text("access_level").$type<AccessLevel>().notNull().default("public"),
  menuSection: text("menu_section").$type<MenuSection>().notNull().default("header"),
  menuOrder: integer("menu_order").notNull().default(0),
  externalUrl: text("external_url").notNull().default(""),
  filters: jsonb("filters").$type<PageFilters>().notNull().default({}),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plannedGames = pgTable("planned_games", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vipPlans = pgTable("vip_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: text("price").notNull().default(""),
  durationDays: integer("duration_days").notNull().default(30),
  description: text("description").notNull().default(""),
  paymentUrl: text("payment_url").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vipRequests = pgTable("vip_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").references(() => vipPlans.id, { onDelete: "set null" }),
  method: text("method").notNull().default(""),
  reference: text("reference").notNull().default(""),
  amount: text("amount").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").$type<VipRequestStatus>().notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
