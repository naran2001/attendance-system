import { parse, differenceInMinutes, isBefore, isAfter } from 'date-fns';

export function calculateTimes(checkIn: string, checkOut: string, breakMinutes: number, shiftStart: string = '09:00', shiftEnd: string = '17:00') {
    try {
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const inMins = parseTime(checkIn);
        const outMins = parseTime(checkOut);
        
        const shiftStartMins = parseTime(shiftStart);
        const shiftEndMins = parseTime(shiftEnd);

        let actualWorked = (outMins - inMins) - breakMinutes;
        if (actualWorked < 0) actualWorked = 0; // Ensure actual worked minutes are not negative

        const earlyCheckInMinutes = inMins < shiftStartMins ? (shiftStartMins - inMins) : 0;
        const lateMinutes = inMins > shiftStartMins ? (inMins - shiftStartMins) : 0;
        const earlyMinutes = outMins < shiftEndMins ? (shiftEndMins - outMins) : 0;
        
        const standardShiftDuration = shiftEndMins - shiftStartMins;
        let overtimeMinutes = 0;
        if (actualWorked > standardShiftDuration) {
            overtimeMinutes = actualWorked - standardShiftDuration;
        }

        return {
            totalHours: Number((actualWorked / 60).toFixed(2)),
            lateMinutes,
            earlyMinutes,
            overtimeMinutes,
            earlyCheckInMinutes
        };
    } catch (e) {
        return { totalHours: 0, lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, earlyCheckInMinutes: 0 };
    }
}
