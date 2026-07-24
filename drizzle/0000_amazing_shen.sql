CREATE TABLE `consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject_name` text NOT NULL,
	`subject_is_adult` integer NOT NULL,
	`explicit_consent` integer NOT NULL,
	`evidence_upload_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evidence_upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `consent_records_user_idx` ON `consent_records` (`user_id`);--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`reason` text NOT NULL,
	`reference_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `credit_ledger_user_created_idx` ON `credit_ledger` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `generations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`tool` text NOT NULL,
	`model` text NOT NULL,
	`prompt` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider` text NOT NULL,
	`provider_job_id` text,
	`asset_key` text,
	`thumbnail_key` text,
	`error_message` text,
	`credits_charged` integer NOT NULL,
	`width` integer,
	`height` integer,
	`duration_seconds` integer,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `generations_user_created_idx` ON `generations` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `generations_status_idx` ON `generations` (`status`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text DEFAULT 'stripe' NOT NULL,
	`provider_customer_id` text,
	`provider_subscription_id` text,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_provider_id_unique` ON `subscriptions` (`provider_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`purpose` text DEFAULT 'reference' NOT NULL,
	`consent_confirmed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `uploads_user_created_idx` ON `uploads` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`plan` text DEFAULT 'creator' NOT NULL,
	`credit_balance` integer DEFAULT 12000 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);