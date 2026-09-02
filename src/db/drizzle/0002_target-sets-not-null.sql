PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_routine_exercises` (
	`id` integer PRIMARY KEY NOT NULL,
	`routine_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`position` integer NOT NULL,
	`target_sets` integer DEFAULT 1 NOT NULL,
	`target_reps` integer,
	`target_time_sec` integer,
	`target_weight_kg` real,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_routine_exercises`("id", "routine_id", "exercise_id", "position", "target_sets", "target_reps", "target_time_sec", "target_weight_kg") SELECT "id", "routine_id", "exercise_id", "position", coalesce("target_sets", 1), "target_reps", "target_time_sec", "target_weight_kg" FROM `routine_exercises`;--> statement-breakpoint
DROP TABLE `routine_exercises`;--> statement-breakpoint
ALTER TABLE `__new_routine_exercises` RENAME TO `routine_exercises`;--> statement-breakpoint
PRAGMA foreign_keys=ON;