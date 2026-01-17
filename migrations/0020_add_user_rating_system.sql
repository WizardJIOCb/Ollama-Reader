-- Create user_rating_config table for user rating algorithm configuration
CREATE TABLE IF NOT EXISTS "user_rating_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prior_mean" numeric(3, 1) DEFAULT '7.5',
	"prior_strength" integer DEFAULT 20,
	"confidence_threshold" integer DEFAULT 30,
	"rater_young_days" integer DEFAULT 7,
	"rater_young_mult" numeric(2, 1) DEFAULT '0.3',
	"rater_medium_days" integer DEFAULT 30,
	"rater_medium_mult" numeric(2, 1) DEFAULT '0.6',
	"rater_mature_mult" numeric(2, 1) DEFAULT '1.0',
	"rater_verified_mult" numeric(3, 2) DEFAULT '1.10',
	"rater_activity_mult" numeric(3, 2) DEFAULT '1.05',
	"rater_min_reading_minutes_30d" integer DEFAULT 60,
	"rater_min_books_added_30d" integer DEFAULT 3,
	"rater_weight_cap" numeric(2, 1) DEFAULT '1.2',
	"rater_weight_floor" numeric(2, 1) DEFAULT '0.2',
	"text_empty_mult" numeric(2, 1) DEFAULT '0.85',
	"text_short_length" integer DEFAULT 20,
	"text_short_mult" numeric(2, 1) DEFAULT '0.6',
	"text_normal_max_length" integer DEFAULT 1200,
	"text_normal_mult" numeric(2, 1) DEFAULT '1.0',
	"text_long_mult" numeric(2, 1) DEFAULT '0.9',
	"text_spam_mult" numeric(2, 1) DEFAULT '0.3',
	"likes_enabled" boolean DEFAULT true,
	"likes_alpha" numeric(2, 1) DEFAULT '0.3',
	"likes_cap" numeric(2, 1) DEFAULT '2.0',
	"time_decay_enabled" boolean DEFAULT false,
	"time_decay_half_life_days" integer DEFAULT 180,
	"time_decay_min_weight" numeric(2, 1) DEFAULT '3.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create user_rating_agg table for efficient incremental rating updates
CREATE TABLE IF NOT EXISTS "user_rating_agg" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"sum_w" numeric(10, 4) DEFAULT '0',
	"sum_wx" numeric(10, 4) DEFAULT '0',
	"count_active" integer DEFAULT 0,
	"recent_sum_w" numeric(10, 4) DEFAULT '0',
	"recent_sum_wx" numeric(10, 4) DEFAULT '0',
	"rating_overall" numeric(3, 1),
	"rating_recent" numeric(3, 1),
	"confidence" numeric(3, 2),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_rating_agg_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Insert default user rating configuration
INSERT INTO "user_rating_config" (
	"prior_mean",
	"prior_strength",
	"confidence_threshold",
	"rater_young_days",
	"rater_young_mult",
	"rater_medium_days",
	"rater_medium_mult",
	"rater_mature_mult",
	"rater_verified_mult",
	"rater_activity_mult",
	"rater_min_reading_minutes_30d",
	"rater_min_books_added_30d",
	"rater_weight_cap",
	"rater_weight_floor",
	"text_empty_mult",
	"text_short_length",
	"text_short_mult",
	"text_normal_max_length",
	"text_normal_mult",
	"text_long_mult",
	"text_spam_mult",
	"likes_enabled",
	"likes_alpha",
	"likes_cap",
	"time_decay_enabled",
	"time_decay_half_life_days",
	"time_decay_min_weight"
) VALUES (
	7.5,
	20,
	30,
	7,
	0.3,
	30,
	0.6,
	1.0,
	1.10,
	1.05,
	60,
	3,
	1.2,
	0.2,
	0.85,
	20,
	0.6,
	1200,
	1.0,
	0.9,
	0.3,
	true,
	0.3,
	2.0,
	false,
	180,
	3.0
);

-- Create index on user_rating_agg for faster lookups
CREATE INDEX IF NOT EXISTS "idx_user_rating_agg_user_id" ON "user_rating_agg"("user_id");

-- Initialize user_rating_agg for existing users with ratings
INSERT INTO "user_rating_agg" ("user_id", "sum_w", "sum_wx", "count_active", "rating_overall", "confidence", "updated_at")
SELECT 
	pr.profile_id as user_id,
	0 as sum_w,
	0 as sum_wx,
	COUNT(*) as count_active,
	NULL as rating_overall,
	0 as confidence,
	NOW() as updated_at
FROM "profile_ratings" pr
GROUP BY pr.profile_id
ON CONFLICT (user_id) DO NOTHING;
