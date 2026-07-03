import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  displayName: text("display_name"),
  image: text("image"),
  passwordHash: text("password_hash"),
  skillLevel: text("skill_level").default("intermediate"),
  dietaryRestrictions: text("dietary_restrictions")
    .array()
    .default(sql`'{}'::text[]`),
  measurementSystem: text("measurement_system").default("imperial"),
  defaultServings: integer("default_servings").default(4),
  voiceEnabled: boolean("voice_enabled").default(true),
  stripeCustomerId: text("stripe_customer_id"),
  revenuecatCustomerId: text("revenuecat_customer_id"),
  planId: text("plan_id").default("trial"),
  subscriptionStatus: text("subscription_status").default("trialing"),
  subscriptionPlatform: text("subscription_platform"),
  billingInterval: text("billing_interval"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  familyId: uuid("family_id"),
  familyRole: text("family_role"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  // Daily AI call quota (reset at UTC midnight via lazy reset on read).
  aiCallsCount: integer("ai_calls_count").default(0).notNull(),
  aiCallsDate: date("ai_calls_date"),
  // Highest trial-reminder milestone already sent (0, 1, 2, or 3 days).
  // Used by scripts/trial-reminders.ts to avoid duplicate emails.
  trialReminderStage: integer("trial_reminder_stage").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const families = pgTable(
  "families",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteCode: text("invite_code").notNull().unique(),
    maxMembers: integer("max_members").default(4),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    adminIndex: index("idx_families_admin").on(table.adminUserId),
    inviteIndex: uniqueIndex("idx_families_invite").on(table.inviteCode),
  })
);

export const cookbooks = pgTable(
  "cookbooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").references(() => families.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    isShared: boolean("is_shared").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIndex: index("idx_cookbooks_user").on(table.userId),
    familyIndex: index("idx_cookbooks_family").on(table.familyId),
  })
);

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cookbookId: uuid("cookbook_id").references(() => cookbooks.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    sourceType: text("source_type").default("manual").notNull(),
    originalImageUrls: text("original_image_urls")
      .array()
      .default(sql`'{}'::text[]`),
    ocrRawText: text("ocr_raw_text"),
    ocrConfidence: real("ocr_confidence"),
    ingredients: jsonb("ingredients").default(sql`'[]'::jsonb`).notNull(),
    steps: jsonb("steps").default(sql`'[]'::jsonb`).notNull(),
    prepTimeMinutes: integer("prep_time_minutes"),
    cookTimeMinutes: integer("cook_time_minutes"),
    totalTimeMinutes: integer("total_time_minutes"),
    servings: integer("servings").default(4),
    cuisine: text("cuisine"),
    tags: text("tags").array().default(sql`'{}'::text[]`),
    difficulty: text("difficulty"),
    nutrition: jsonb("nutrition"),
    forkedFromId: uuid("forked_from_id"),
    forkedFromUser: text("forked_from_user"),
    isPublic: boolean("is_public").default(false),
    publicSlug: text("public_slug").unique(),
    shareCount: integer("share_count").default(0),
    version: integer("version").default(1),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIndex: index("idx_recipes_user").on(table.userId),
    cookbookIndex: index("idx_recipes_cookbook").on(table.cookbookId),
    publicSlugIndex: index("idx_recipes_public_slug").on(table.publicSlug),
    tagsIndex: index("idx_recipes_tags").on(table.tags),
    deletedIndex: index("idx_recipes_deleted").on(table.deletedAt),
  })
);

export const recipeVersions = pgTable(
  "recipe_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    changesSummary: text("changes_summary").notNull(),
    changedById: uuid("changed_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    changedByName: text("changed_by_name").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    recipeIndex: index("idx_recipe_versions_recipe").on(table.recipeId),
    uniqueVersion: uniqueIndex("idx_recipe_versions_unique").on(
      table.recipeId,
      table.version
    ),
  })
);

export const cookingSessions = pgTable(
  "cooking_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    status: text("status").default("active"),
    currentStep: integer("current_step").default(1),
    voiceEnabled: boolean("voice_enabled").default(false),
    messages: jsonb("messages").default(sql`'[]'::jsonb`),
    totalInputTokens: integer("total_input_tokens").default(0),
    totalOutputTokens: integer("total_output_tokens").default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => ({
    userIndex: index("idx_cooking_sessions_user").on(table.userId),
    recipeIndex: index("idx_cooking_sessions_recipe").on(table.recipeId),
    activeIndex: index("idx_cooking_sessions_active").on(
      table.userId,
      table.status
    ),
  })
);

export const cookLogs = pgTable(
  "cook_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cookedAt: date("cooked_at").default(sql`CURRENT_DATE`).notNull(),
    rating: integer("rating"),
    notes: text("notes"),
    wouldMakeAgain: boolean("would_make_again"),
    modifications: jsonb("modifications").default(sql`'[]'::jsonb`),
    photoUrls: text("photo_urls").array().default(sql`'{}'::text[]`),
    cookingSessionId: uuid("cooking_session_id").references(
      () => cookingSessions.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    recipeIndex: index("idx_cook_logs_recipe").on(table.recipeId),
    userIndex: index("idx_cook_logs_user").on(table.userId),
    dateIndex: index("idx_cook_logs_date").on(table.cookedAt),
  })
);

export const scanJobs = pgTable(
  "scan_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrls: text("image_urls").array().notNull(),
    status: text("status").default("pending"),
    errorMessage: text("error_message"),
    rawOcrText: text("raw_ocr_text"),
    parsedRecipe: jsonb("parsed_recipe"),
    confidence: real("confidence"),
    thumbnailUrl: text("thumbnail_url"),
    recipeId: uuid("recipe_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    userIndex: index("idx_scan_jobs_user").on(table.userId),
    statusIndex: index("idx_scan_jobs_status").on(table.status),
  })
);

export const sharedRecipes = pgTable(
  "shared_recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    cookbookId: uuid("cookbook_id")
      .notNull()
      .references(() => cookbooks.id, { onDelete: "cascade" }),
    sharedById: uuid("shared_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueIndex: uniqueIndex("idx_shared_recipes_unique").on(
      table.recipeId,
      table.cookbookId
    ),
    cookbookIndex: index("idx_shared_recipes_cookbook").on(table.cookbookId),
    recipeIndex: index("idx_shared_recipes_recipe").on(table.recipeId),
  })
);

export const offlineCache = pgTable(
  "offline_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    cachedAt: timestamp("cached_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueIndex: uniqueIndex("idx_offline_cache_unique").on(
      table.userId,
      table.recipeId,
      table.deviceId
    ),
  })
);

// Processed webhook event ids, used to make webhook handlers idempotent.
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  referralCode: text("referral_code"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      name: "accounts_pk",
      columns: [table.provider, table.providerAccountId],
    }),
    userIndex: index("idx_accounts_user").on(table.userId),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      name: "verification_tokens_pk",
      columns: [table.identifier, table.token],
    }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
