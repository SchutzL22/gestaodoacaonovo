-- AlterTable: Add academic dates and min_grade to classrooms
ALTER TABLE "classrooms"
  ADD COLUMN "enrollment_start_date" TIMESTAMP(3),
  ADD COLUMN "enrollment_end_date" TIMESTAMP(3),
  ADD COLUMN "cancellation_deadline" TIMESTAMP(3),
  ADD COLUMN "min_grade" DOUBLE PRECISION NOT NULL DEFAULT 7.0;

-- AlterTable: Add evaluation grades (A1, A2, A3) and final grade to enrollments
ALTER TABLE "enrollments"
  ADD COLUMN "grade_a1" DOUBLE PRECISION,
  ADD COLUMN "grade_a2" DOUBLE PRECISION,
  ADD COLUMN "grade_a3" DOUBLE PRECISION,
  ADD COLUMN "final_grade" DOUBLE PRECISION;
