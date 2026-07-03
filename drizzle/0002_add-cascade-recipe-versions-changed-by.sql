ALTER TABLE "recipe_versions" DROP CONSTRAINT "recipe_versions_changed_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;