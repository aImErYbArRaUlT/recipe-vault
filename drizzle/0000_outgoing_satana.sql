CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "cook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"cooked_at" date DEFAULT CURRENT_DATE NOT NULL,
	"rating" integer,
	"notes" text,
	"would_make_again" boolean,
	"modifications" jsonb DEFAULT '[]'::jsonb,
	"photo_urls" text[] DEFAULT '{}'::text[],
	"cooking_session_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cookbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"is_shared" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"status" text DEFAULT 'active',
	"current_step" integer DEFAULT 1,
	"voice_enabled" boolean DEFAULT false,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"total_input_tokens" integer DEFAULT 0,
	"total_output_tokens" integer DEFAULT 0,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"max_members" integer DEFAULT 4,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "families_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "offline_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"changes_summary" text NOT NULL,
	"changed_by_id" uuid NOT NULL,
	"changed_by_name" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cookbook_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"original_image_urls" text[] DEFAULT '{}'::text[],
	"ocr_raw_text" text,
	"ocr_confidence" real,
	"ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prep_time_minutes" integer,
	"cook_time_minutes" integer,
	"total_time_minutes" integer,
	"servings" integer DEFAULT 4,
	"cuisine" text,
	"tags" text[] DEFAULT '{}'::text[],
	"difficulty" text,
	"nutrition" jsonb,
	"forked_from_id" uuid,
	"forked_from_user" text,
	"is_public" boolean DEFAULT false,
	"public_slug" text,
	"share_count" integer DEFAULT 0,
	"version" integer DEFAULT 1,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE "scan_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_urls" text[] NOT NULL,
	"status" text DEFAULT 'pending',
	"error_message" text,
	"raw_ocr_text" text,
	"parsed_recipe" jsonb,
	"confidence" real,
	"thumbnail_url" text,
	"recipe_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shared_recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"cookbook_id" uuid NOT NULL,
	"shared_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"display_name" text,
	"image" text,
	"password_hash" text,
	"skill_level" text DEFAULT 'intermediate',
	"dietary_restrictions" text[] DEFAULT '{}'::text[],
	"measurement_system" text DEFAULT 'imperial',
	"default_servings" integer DEFAULT 4,
	"voice_enabled" boolean DEFAULT true,
	"stripe_customer_id" text,
	"plan_id" text DEFAULT 'trial',
	"subscription_status" text DEFAULT 'trialing',
	"billing_interval" text,
	"trial_ends_at" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"family_id" uuid,
	"family_role" text,
	"onboarding_complete" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"referral_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cook_logs" ADD CONSTRAINT "cook_logs_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cook_logs" ADD CONSTRAINT "cook_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cook_logs" ADD CONSTRAINT "cook_logs_cooking_session_id_cooking_sessions_id_fk" FOREIGN KEY ("cooking_session_id") REFERENCES "public"."cooking_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbooks" ADD CONSTRAINT "cookbooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbooks" ADD CONSTRAINT "cookbooks_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_cache" ADD CONSTRAINT "offline_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_cache" ADD CONSTRAINT "offline_cache_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_cookbook_id_cookbooks_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_recipes" ADD CONSTRAINT "shared_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_recipes" ADD CONSTRAINT "shared_recipes_cookbook_id_cookbooks_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_recipes" ADD CONSTRAINT "shared_recipes_shared_by_id_users_id_fk" FOREIGN KEY ("shared_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_user" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cook_logs_recipe" ON "cook_logs" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_cook_logs_user" ON "cook_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cook_logs_date" ON "cook_logs" USING btree ("cooked_at");--> statement-breakpoint
CREATE INDEX "idx_cookbooks_user" ON "cookbooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cookbooks_family" ON "cookbooks" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "idx_cooking_sessions_user" ON "cooking_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cooking_sessions_recipe" ON "cooking_sessions" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_cooking_sessions_active" ON "cooking_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_families_admin" ON "families" USING btree ("admin_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_families_invite" ON "families" USING btree ("invite_code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_offline_cache_unique" ON "offline_cache" USING btree ("user_id","recipe_id","device_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_versions_recipe" ON "recipe_versions" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_recipe_versions_unique" ON "recipe_versions" USING btree ("recipe_id","version");--> statement-breakpoint
CREATE INDEX "idx_recipes_user" ON "recipes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recipes_cookbook" ON "recipes" USING btree ("cookbook_id");--> statement-breakpoint
CREATE INDEX "idx_recipes_public_slug" ON "recipes" USING btree ("public_slug");--> statement-breakpoint
CREATE INDEX "idx_recipes_tags" ON "recipes" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "idx_recipes_deleted" ON "recipes" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_scan_jobs_user" ON "scan_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scan_jobs_status" ON "scan_jobs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_shared_recipes_unique" ON "shared_recipes" USING btree ("recipe_id","cookbook_id");--> statement-breakpoint
CREATE INDEX "idx_shared_recipes_cookbook" ON "shared_recipes" USING btree ("cookbook_id");--> statement-breakpoint
CREATE INDEX "idx_shared_recipes_recipe" ON "shared_recipes" USING btree ("recipe_id");