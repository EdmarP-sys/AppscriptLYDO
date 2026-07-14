-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'SK', 'LYDC', 'scholar', 'encoder')),
    barangay VARCHAR(100),
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scholar Applications Table (LYDC Resolution No. 5, Series of 2026)
CREATE SEQUENCE IF NOT EXISTS scholar_afs_seq START 1;

CREATE TABLE IF NOT EXISTS scholar_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_no VARCHAR(50) UNIQUE,
    date_filed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    student_full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    sex VARCHAR(10) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    school VARCHAR(150) NOT NULL,
    school_year VARCHAR(50) NOT NULL,
    
    is_solo_parent_beneficiary BOOLEAN DEFAULT FALSE,
    is_orphan BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    is_ip BOOLEAN DEFAULT FALSE,
    is_out_of_school_youth BOOLEAN DEFAULT FALSE,
    special_circumstances_specify TEXT,
    
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    evaluated_by VARCHAR(50) REFERENCES users(username) ON DELETE SET NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE
);

-- Documents Table (Logs metadata of files uploaded to Google Drive)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id VARCHAR(100) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    uploaded_by VARCHAR(50) REFERENCES users(username) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deadlines Table
CREATE TABLE IF NOT EXISTS deadlines (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(50) REFERENCES users(username) ON DELETE SET NULL
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT
);

-- Seed initial admin user if not exists
-- (Password hash represents bcrypt hash of 'Admin@2026!')
INSERT INTO users (username, password_hash, role, display_name)
VALUES (
    'admin', 
    '$2b$10$pxBfx8kWYuOrntklVC1Dxefc9LqE/1FDx3JCYORQkt4mbT6YE9.8.', 
    'admin', 
    'System Administrator'
)
ON CONFLICT (username) DO NOTHING;

-- Seed 5 encoder accounts
-- (Password hash represents bcrypt hash of 'encoder1234')
INSERT INTO users (username, password_hash, role, display_name)
VALUES
    ('encoder1', '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', 'encoder', 'Encoder 1'),
    ('encoder2', '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', 'encoder', 'Encoder 2'),
    ('encoder3', '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', 'encoder', 'Encoder 3'),
    ('encoder4', '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', 'encoder', 'Encoder 4'),
    ('encoder5', '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', 'encoder', 'Encoder 5')
ON CONFLICT (username) DO NOTHING;
