# SyncTime - Employee Attendance Management System

This is a modern, full-stack rewrite of the Employee Attendance system using **Next.js**, **React**, **Tailwind CSS**, and **SQLite**.

## Features
- **React Frontend**: Beautiful, modern UI using Tailwind CSS and Lucide icons.
- **Next.js API**: Serverless-style API routes handling all business logic.
- **Self-contained DB**: Uses `better-sqlite3`—no separate database server needed!
- **Time Tracking**: Automated calculation for late arrivals, early leaves, total hours, and overtime.
- **Monthly Summary & CSV Export**: Built-in reporting.

## Installation & Setup

1. **Prerequisites**
   Ensure you have Node.js (v18+) and npm installed.

2. **Navigate to the Next.js Project Directory**
   Open a terminal and navigate to the `nextjs-app` folder:
   ```cmd
   cd c:\Users\LahiruIT\Documents\Attendence\nextjs-app
   ```

3. **Install Dependencies**
   If not already installed during setup, run:
   ```cmd
   npm install
   ```

4. **Run the Application**
   Start the Next.js development server:
   ```cmd
   npm run dev
   ```
   *(The SQLite database `attendance.db` will automatically initialize on the first API hit.)*

5. **Access the System**
   Open your web browser and go to:
   [http://localhost:3000](http://localhost:3000)

## System Rules
- **Default Working Hours**: 09:00 AM to 05:00 PM (17:00)
- **Late Arrival**: Any check-in after 09:00 AM.
- **Early Leave**: Any check-out before 05:00 PM.
- **Overtime**: Any accumulated active time exceeding 8 hours per day.
