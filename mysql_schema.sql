-- Create the database
CREATE DATABASE IF NOT EXISTS attendance_db;

-- Use the database
USE attendance_db;

-- Create the attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME,
    break_minutes INT DEFAULT 0,
    total_hours DECIMAL(5,2) DEFAULT 0.00,
    late_minutes INT DEFAULT 0,
    early_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    UNIQUE KEY emp_date_unique (employee_id, date)
);
