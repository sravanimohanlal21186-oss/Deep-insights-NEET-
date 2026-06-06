-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_attempts INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer VARCHAR(1) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subject (subject),
  INDEX idx_difficulty (difficulty),
  INDEX idx_created_at (created_at)
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
);

-- Exam sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id),
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_exam_id (exam_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Exam results table
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES exam_sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  score DECIMAL(5,2) NOT NULL,
  time_taken INTEGER NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Create composite indexes for common queries
CREATE INDEX idx_sessions_user_exam ON exam_sessions(user_id, exam_id);
CREATE INDEX idx_results_user_exam ON exam_results(user_id, session_id);
