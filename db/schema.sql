-- Fitness Tracker Database Schema
-- Run this against your PostgreSQL database to set up all tables

-- User Profile
CREATE TABLE IF NOT EXISTS user_profile (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL DEFAULT 'default_user',
  height_cm REAL,
  weight_kg REAL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition Goals
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  daily_calories INTEGER DEFAULT 2000,
  protein_g INTEGER DEFAULT 150,
  carbs_g INTEGER DEFAULT 200,
  fats_g INTEGER DEFAULT 65,
  water_ml INTEGER DEFAULT 4000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meals
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name TEXT,
  notes TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food Items
CREATE TABLE IF NOT EXISTS food_items (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER REFERENCES meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  unit TEXT DEFAULT 'serving',
  calories REAL DEFAULT 0,
  protein_g REAL DEFAULT 0,
  carbs_g REAL DEFAULT 0,
  fats_g REAL DEFAULT 0,
  fiber_g REAL,
  sugar_g REAL,
  sodium_mg REAL,
  vitamin_c_mg REAL,
  vitamin_d_mcg REAL,
  calcium_mg REAL,
  iron_mg REAL
);

-- Water Logs
CREATE TABLE IF NOT EXISTS water_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workouts
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT CHECK (workout_type IN ('strength', 'cardio')),
  title TEXT,
  duration_minutes INTEGER,
  total_volume REAL,
  notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  sets_completed INTEGER DEFAULT 0,
  target_sets INTEGER DEFAULT 3,
  weight_kg REAL,
  notes TEXT
);

-- Exercise Sets
CREATE TABLE IF NOT EXISTS exercise_sets (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg REAL,
  rest_seconds INTEGER,
  rpe REAL CHECK (rpe >= 1 AND rpe <= 10)
);

-- Cardio Sessions
CREATE TABLE IF NOT EXISTS cardio_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cardio_type TEXT,
  duration_minutes INTEGER,
  distance_km REAL,
  avg_heart_rate INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Body Metrics
CREATE TABLE IF NOT EXISTS body_metrics (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg REAL,
  body_fat_percent REAL,
  chest_cm REAL,
  waist_cm REAL,
  hips_cm REAL,
  left_arm_cm REAL,
  right_arm_cm REAL,
  left_thigh_cm REAL,
  right_thigh_cm REAL,
  notes TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Photos
CREATE TABLE IF NOT EXISTS progress_photos (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT NOT NULL,
  category TEXT CHECK (category IN ('front', 'side', 'back')),
  notes TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sleep Logs
CREATE TABLE IF NOT EXISTS sleep_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bedtime TIME,
  wake_time TIME,
  hours_slept REAL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Heart Rate Logs
CREATE TABLE IF NOT EXISTS heart_rate_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  resting_hr INTEGER,
  avg_hr INTEGER,
  max_hr INTEGER,
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recovery Scores
CREATE TABLE IF NOT EXISTS recovery_scores (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recovery_score INTEGER CHECK (recovery_score >= 0 AND recovery_score <= 100),
  sleep_score INTEGER,
  hrv_score INTEGER,
  muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON body_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_user_date ON recovery_scores(user_id, date);

-- Insert default user profile and nutrition goals
INSERT INTO user_profile (user_id, height_cm, weight_kg, activity_level)
VALUES ('default_user', 175, 75, 'moderately_active')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO nutrition_goals (user_id, daily_calories, protein_g, carbs_g, fats_g, water_ml)
VALUES ('default_user', 2500, 180, 250, 70, 4000)
ON CONFLICT DO NOTHING;
