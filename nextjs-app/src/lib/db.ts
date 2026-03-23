import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Auto-migration for schema upgrades
(async () => {
    try {
        await pool.execute("ALTER TABLE attendance ADD COLUMN status ENUM('pending', 'approved') DEFAULT 'approved'");
        console.log("Database migrated: added status column.");
    } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('Migration error:', e);
    }
    
    try {
        await pool.execute("ALTER TABLE users ADD COLUMN shift_start TIME DEFAULT '09:00:00'");
        await pool.execute("ALTER TABLE users ADD COLUMN shift_end TIME DEFAULT '17:00:00'");
        console.log("Database migrated: added shift metrics.");
    } catch(e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('Migration error:', e);
    }
    
    try {
        await pool.execute("ALTER TABLE attendance ADD COLUMN early_checkin_minutes INT DEFAULT 0");
        console.log("Database migrated: added early checkin minutes.");
    } catch(e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('Migration error:', e);
    }
})();

pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee') DEFAULT 'employee'
    )
`).then(() => {
    pool.execute(`
        INSERT IGNORE INTO users (employee_id, password, role) 
        VALUES ('admin', 'admin123', 'admin')
    `);
}).catch(console.error);

export default pool;

export const DEFAULT_START_TIME = "09:00";
export const DEFAULT_END_TIME = "17:30";
export const WORK_HOURS_PER_DAY = 8.5;
