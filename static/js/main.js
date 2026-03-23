document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentDate = new Date().toISOString().split('T')[0];
    let currentMonth = currentDate.substring(0, 7);
    
    // Elements
    const dateInput = document.getElementById('current-date');
    const recordsTableBody = document.querySelector('#records-table tbody');
    const summaryTableBody = document.querySelector('#summary-table tbody');
    const summaryMonthInput = document.getElementById('summary-month');
    
    // Initialize Dates
    dateInput.value = currentDate;
    summaryMonthInput.value = currentMonth;
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');
            
            sections.forEach(sec => {
                sec.style.display = sec.id === target ? 'block' : 'none';
            });

            if(target === 'dashboard') loadRecords();
            if(target === 'summary') loadSummary();
        });
    });

    // Event Listeners for Dates
    dateInput.addEventListener('change', (e) => {
        currentDate = e.target.value;
        loadRecords();
    });
    
    summaryMonthInput.addEventListener('change', (e) => {
        currentMonth = e.target.value;
        loadSummary();
    });

    // Check In / Check Out
    const empIdInput = document.getElementById('employee-id');
    const btnCheckin = document.getElementById('btn-checkin');
    const btnCheckout = document.getElementById('btn-checkout');
    const addBreakCheckbox = document.getElementById('add-break');
    const breakMinutesInput = document.getElementById('break-minutes');

    addBreakCheckbox.addEventListener('change', (e) => {
        breakMinutesInput.disabled = !e.target.checked;
    });

    btnCheckin.addEventListener('click', async () => {
        const empId = empIdInput.value.trim();
        if(!empId) return showToast('Please enter Employee ID', 'error');
        
        try {
            const res = await fetch('/api/checkin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ employee_id: empId, date: currentDate })
            });
            const data = await res.json();
            if(res.ok) {
                showToast(data.message, 'success');
                empIdInput.value = '';
                loadRecords();
            } else {
                showToast(data.error, 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
    });

    btnCheckout.addEventListener('click', async () => {
        const empId = empIdInput.value.trim();
        if(!empId) return showToast('Please enter Employee ID', 'error');
        
        let breakMins = 0;
        if(addBreakCheckbox.checked) {
            breakMins = parseInt(breakMinutesInput.value) || 0;
        }

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ employee_id: empId, date: currentDate, break_minutes: breakMins })
            });
            const data = await res.json();
            if(res.ok) {
                showToast(data.message, 'success');
                empIdInput.value = '';
                addBreakCheckbox.checked = false;
                breakMinutesInput.disabled = true;
                breakMinutesInput.value = '0';
                loadRecords();
            } else {
                showToast(data.error, 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
    });

    // Manual Modal
    const manualModal = document.getElementById('manual-modal');
    const btnAddManual = document.getElementById('btn-add-manual');
    const closeBtn = document.querySelector('.close-btn');
    const manualForm = document.getElementById('manual-form');

    btnAddManual.addEventListener('click', () => {
        document.getElementById('m-date').value = currentDate;
        manualModal.classList.add('show');
    });

    closeBtn.addEventListener('click', () => {
        manualModal.classList.remove('show');
    });

    manualForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const checkOutVal = document.getElementById('m-check-out').value;
        const breakMinsVal = document.getElementById('m-break').value;
        const payload = {
            employee_id: document.getElementById('m-emp-id').value,
            date: document.getElementById('m-date').value,
            check_in: document.getElementById('m-check-in').value,
            check_out: checkOutVal ? checkOutVal : null,
            break_minutes: breakMinsVal ? parseInt(breakMinsVal) : 0
        };

        try {
            const res = await fetch('/api/add_manual', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(res.ok) {
                showToast(data.message, 'success');
                manualModal.classList.remove('show');
                manualForm.reset();
                if(payload.date === currentDate) loadRecords();
            } else {
                showToast(data.error, 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
    });

    // Export CSV
    document.getElementById('btn-export').addEventListener('click', () => {
        window.location.href = `/api/export?month=${currentMonth}`;
    });

    // Data Loaders
    async function loadRecords() {
        try {
            const res = await fetch(`/api/records?date=${currentDate}`);
            const records = await res.json();
            
            recordsTableBody.innerHTML = '';
            if(records.length === 0) {
                recordsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center">No records found for this date.</td></tr>';
                return;
            }

            records.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${r.employee_id}</strong></td>
                    <td>${r.check_in}</td>
                    <td>${r.check_out || '-'}</td>
                    <td>${r.break_minutes || 0}</td>
                    <td>${r.total_hours || '0.0'}</td>
                    <td class="${r.late_minutes > 0 ? 'text-danger' : ''}">${r.late_minutes || 0}</td>
                    <td class="${r.early_minutes > 0 ? 'text-danger' : ''}">${r.early_minutes || 0}</td>
                    <td class="${r.overtime_minutes > 0 ? 'text-success' : ''}">${r.overtime_minutes || 0}</td>
                `;
                recordsTableBody.appendChild(tr);
            });
        } catch(err) {
            console.error(err);
        }
    }

    async function loadSummary() {
        try {
            const res = await fetch(`/api/summary?month=${currentMonth}`);
            const summary = await res.json();
            
            summaryTableBody.innerHTML = '';
            if(summary.length === 0) {
                summaryTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">No records found for this month.</td></tr>';
                return;
            }

            summary.forEach(r => {
                const tr = document.createElement('tr');
                const totalHours = typeof r.total_hours === 'number' ? r.total_hours.toFixed(2) : r.total_hours;
                tr.innerHTML = `
                    <td><strong>${r.employee_id}</strong></td>
                    <td>${r.days_worked}</td>
                    <td>${totalHours}</td>
                    <td>${r.total_late_minutes || 0}</td>
                    <td>${r.total_early_minutes || 0}</td>
                    <td>${r.total_overtime_minutes || 0}</td>
                `;
                summaryTableBody.appendChild(tr);
            });
        } catch(err) {
            console.error(err);
        }
    }

    // Utils
    function showToast(msg, type) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Init
    loadRecords();
});
