import os
import sqlite3
import datetime
import csv
import io
from flask import Flask, request, jsonify, render_template, send_file

app = Flask(__name__)
DB_FILE = "attendance.db"
DEFAULT_START_TIME = "09:00"
DEFAULT_END_TIME = "17:00"
WORK_HOURS_PER_DAY = 8

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT NOT NULL,
            date TEXT NOT NULL,
            check_in TEXT NOT NULL,
            check_out TEXT,
            break_minutes INTEGER DEFAULT 0,
            total_hours REAL DEFAULT 0.0,
            late_minutes INTEGER DEFAULT 0,
            early_minutes INTEGER DEFAULT 0,
            overtime_minutes INTEGER DEFAULT 0,
            UNIQUE(employee_id, date)
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def calculate_times(check_in_str, check_out_str, break_minutes):
    fmt = "%H:%M"
    try:
        t_in = datetime.datetime.strptime(check_in_str, fmt)
        t_out = datetime.datetime.strptime(check_out_str, fmt)
        t_start = datetime.datetime.strptime(DEFAULT_START_TIME, fmt)
        t_end = datetime.datetime.strptime(DEFAULT_END_TIME, fmt)
    except ValueError:
        return 0, 0, 0, 0
    
    # Calculate late minutes
    late_minutes = 0
    if t_in > t_start:
        late_diff = t_in - t_start
        late_minutes = int(late_diff.total_seconds() / 60)
        
    # Calculate early leaving minutes
    early_minutes = 0
    if t_out < t_end:
        early_diff = t_end - t_out
        early_minutes = int(early_diff.total_seconds() / 60)
        
    # Total active minutes
    total_diff = t_out - t_in
    total_active_minutes = int(total_diff.total_seconds() / 60) - break_minutes
    if total_active_minutes < 0:
        total_active_minutes = 0
        
    total_hours = round(total_active_minutes / 60.0, 2)
    
    # Overtime minutes
    standard_minutes = WORK_HOURS_PER_DAY * 60
    overtime_minutes = 0
    if total_active_minutes > standard_minutes:
        overtime_minutes = total_active_minutes - standard_minutes
        
    return total_hours, late_minutes, early_minutes, overtime_minutes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/records', methods=['GET'])
def get_records():
    date = request.args.get('date', datetime.date.today().strftime('%Y-%m-%d'))
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM attendance WHERE date = ? ORDER BY employee_id', (date,)).fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in records])

@app.route('/api/checkin', methods=['POST'])
def checkin():
    data = request.json
    employee_id = data.get('employee_id')
    date = data.get('date', datetime.date.today().strftime('%Y-%m-%d'))
    check_in = data.get('check_in', datetime.datetime.now().strftime('%H:%M'))
    
    if not employee_id:
        return jsonify({'error': 'Employee ID is required'}), 400
        
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO attendance (employee_id, date, check_in) VALUES (?, ?, ?)',
                     (employee_id, date, check_in))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Attendance record already exists for this date.'}), 400
    conn.close()
    return jsonify({'success': True, 'message': 'Checked in successfully'})

@app.route('/api/checkout', methods=['POST'])
def checkout():
    data = request.json
    employee_id = data.get('employee_id')
    date = data.get('date', datetime.date.today().strftime('%Y-%m-%d'))
    check_out = data.get('check_out', datetime.datetime.now().strftime('%H:%M'))
    break_minutes = int(data.get('break_minutes', 0))
    
    if not employee_id:
        return jsonify({'error': 'Employee ID is required'}), 400
        
    conn = get_db_connection()
    record = conn.execute('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', (employee_id, date)).fetchone()
    
    if not record:
        conn.close()
        return jsonify({'error': 'No check-in record found for this day.'}), 404
        
    check_in = record['check_in']
    
    if check_out < check_in:
        conn.close()
        return jsonify({'error': 'Check-out time cannot be before check-in time.'}), 400
    
    total_hours, late_minutes, early_minutes, overtime_minutes = calculate_times(check_in, check_out, break_minutes)
    
    conn.execute('''
        UPDATE attendance 
        SET check_out = ?, break_minutes = ?, total_hours = ?, 
            late_minutes = ?, early_minutes = ?, overtime_minutes = ?
        WHERE employee_id = ? AND date = ?
    ''', (check_out, break_minutes, total_hours, late_minutes, early_minutes, overtime_minutes, employee_id, date))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Checked out successfully'})

@app.route('/api/add_manual', methods=['POST'])
def add_manual():
    data = request.json
    employee_id = data.get('employee_id')
    date = data.get('date')
    check_in = data.get('check_in')
    check_out = data.get('check_out')
    
    if not all([employee_id, date, check_in]):
        return jsonify({'error': 'Employee ID, Date, and Check-in are required'}), 400
        
    break_minutes = 0
    if 'break_minutes' in data and data['break_minutes']:
        break_minutes = int(data['break_minutes'])

    conn = get_db_connection()
    
    total_hours, late_minutes, early_minutes, overtime_minutes = 0.0, 0, 0, 0
    if check_out:
        if check_out < check_in:
            conn.close()
            return jsonify({'error': 'Check-out time cannot be before check-in time.'}), 400
        total_hours, late_minutes, early_minutes, overtime_minutes = calculate_times(check_in, check_out, break_minutes)
        
    try:
        conn.execute('''
            INSERT INTO attendance (employee_id, date, check_in, check_out, break_minutes, 
                                    total_hours, late_minutes, early_minutes, overtime_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (employee_id, date, check_in, check_out, break_minutes, total_hours, late_minutes, early_minutes, overtime_minutes))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Attendance record already exists for this date.'}), 400
        
    conn.close()
    return jsonify({'success': True, 'message': 'Manual record added successfully'})

@app.route('/api/summary', methods=['GET'])
def get_summary():
    month = request.args.get('month', datetime.date.today().strftime('%Y-%m'))
    conn = get_db_connection()
    query = '''
        SELECT employee_id, 
               COUNT(id) as days_worked,
               SUM(total_hours) as total_hours,
               SUM(late_minutes) as total_late_minutes,
               SUM(early_minutes) as total_early_minutes,
               SUM(overtime_minutes) as total_overtime_minutes
        FROM attendance 
        WHERE date LIKE ?
        GROUP BY employee_id
        ORDER BY employee_id
    '''
    records = conn.execute(query, (month + '%',)).fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in records])

@app.route('/api/export', methods=['GET'])
def export_csv():
    month = request.args.get('month', datetime.date.today().strftime('%Y-%m'))
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM attendance WHERE date LIKE ? ORDER BY date DESC, employee_id', (month + '%',)).fetchall()
    conn.close()
    
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['ID', 'Employee ID', 'Date', 'Check In', 'Check Out', 'Break (Mins)', 
                 'Total Hours', 'Late (Mins)', 'Early (Mins)', 'Overtime (Mins)'])
    
    for r in records:
        cw.writerow([r['id'], r['employee_id'], r['date'], r['check_in'], r['check_out'], 
                     r['break_minutes'], r['total_hours'], r['late_minutes'], 
                     r['early_minutes'], r['overtime_minutes']])
                     
    output = io.BytesIO()
    output.write(si.getvalue().encode('utf-8'))
    output.seek(0)
    
    filename = f"attendance_report_{month}.csv"
    return send_file(output, as_attachment=True, download_name=filename, mimetype='text/csv')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
