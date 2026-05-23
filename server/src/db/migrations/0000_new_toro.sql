CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enhanced_lerg" (
	"npa" varchar(3) PRIMARY KEY NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"country_name" varchar(100) NOT NULL,
	"state_province_code" varchar(2) NOT NULL,
	"state_province_name" varchar(100) NOT NULL,
	"region" varchar(50),
	"category" varchar(20) NOT NULL,
	"source" varchar(20) DEFAULT 'lerg' NOT NULL,
	"confidence_score" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "valid_npa" CHECK ("enhanced_lerg"."npa" ~ '^[0-9]{3}$'),
	CONSTRAINT "valid_country_code" CHECK ("enhanced_lerg"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "valid_state_code" CHECK ("enhanced_lerg"."state_province_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "valid_category" CHECK ("enhanced_lerg"."category" IN ('us-domestic', 'canadian', 'caribbean', 'pacific')),
	CONSTRAINT "valid_source" CHECK ("enhanced_lerg"."source" IN ('lerg', 'manual', 'import', 'seed', 'consolidated')),
	CONSTRAINT "valid_confidence" CHECK ("enhanced_lerg"."confidence_score" >= 0 AND "enhanced_lerg"."confidence_score" <= 1)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_enhanced_lerg_country" ON "enhanced_lerg" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "idx_enhanced_lerg_state" ON "enhanced_lerg" USING btree ("state_province_code");--> statement-breakpoint
CREATE INDEX "idx_enhanced_lerg_category" ON "enhanced_lerg" USING btree ("category");