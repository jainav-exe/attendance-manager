import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [dailyMessage, setDailyMessage] = useState('');
  const [periodMessage, setPeriodMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverTime, setServerTime] = useState(null);
  const [canMarkAttendance, setCanMarkAttendance] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, dailyMessageRes, serverTimeRes] = await Promise.all([
        axios.get(`/api/attendance/${user._id}`),
        axios.get('/api/messages/daily'),
        axios.get('/api/time')
      ]);

      setAttendanceHistory(attendanceRes.data);
      setDailyMessage(dailyMessageRes.data.message);
      setServerTime(new Date(serverTimeRes.data.serverTime));
      await updateCurrentPeriod();
    } catch (error) {
      setError('Error fetching data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentPeriod = async () => {
    try {
      const timetableRes = await axios.get('/api/timetable');
      const timetable = timetableRes.data;
      const now = new Date();
      
      for (let i = 0; i < timetable.length; i++) {
        const period = timetable[i];
        const [startHour, startMin] = period.startTime.split(':').map(Number);
        const [endHour, endMin] = period.endTime.split(':').map(Number);
        
        const startTime = new Date(now);
        startTime.setHours(startHour, startMin, 0, 0);
        
        const endTime = new Date(now);
        endTime.setHours(endHour, endMin, 0, 0);
        
        if (now >= startTime && now < endTime) {
          setCurrentPeriod({
            number: i + 1,
            startTime,
            endTime
          });
          
          // Check if within first minute
          const timeDiff = now - startTime;
          setCanMarkAttendance(timeDiff <= 60000);
          
          // Fetch period message
          const messageRes = await axios.get(`/api/messages/period/${i + 1}`);
          setPeriodMessage(messageRes.data.message);
          return;
        }
      }
      setCurrentPeriod(null);
      setCanMarkAttendance(false);
    } catch (error) {
      console.error('Error updating current period:', error);
    }
  };

  const updateTime = () => {
    if (currentPeriod) {
      const now = new Date();
      const timeLeft = currentPeriod.endTime - now;
      setTimeRemaining(Math.max(0, Math.floor(timeLeft / 1000)));
      
      // Update attendance marking availability
      const timeDiff = now - currentPeriod.startTime;
      setCanMarkAttendance(timeDiff <= 60000);
    }
  };

  const markAttendance = async () => {
    try {
      if (!currentPeriod || !canMarkAttendance) return;
      
      await axios.post('/api/attendance/mark', {
        period: currentPeriod.number,
        status: 'present',
        timestamp: new Date().toISOString()
      });
      
      await fetchData();
    } catch (error) {
      setError('Error marking attendance');
      console.error('Error:', error);
    }
  };

  if (loading) return (
    <div className="p-4" role="status" aria-live="polite">
      Loading dashboard data...
    </div>
  );
  
  if (error) return (
    <div className="p-4 text-red-700 bg-red-100 rounded" role="alert">
      {error}
    </div>
  );

  return (
    <main className="p-4 max-w-4xl mx-auto" role="main">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      
      {/* Current Period Info */}
      {currentPeriod && (
        <section className="mb-8" aria-labelledby="current-period-heading">
          <div className="border p-4 rounded shadow-sm">
            <h2 id="current-period-heading" className="text-xl font-semibold mb-2">
              Current Period: {currentPeriod.number}
            </h2>
            <div className="space-y-2">
              <p className="flex items-center">
                <span className="font-medium mr-2">Time Remaining:</span>
                <time dateTime={`PT${Math.floor(timeRemaining / 60)}M${timeRemaining % 60}S`}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </time>
              </p>
              {periodMessage && (
                <p className="flex items-start">
                  <span className="font-medium mr-2">Period Message:</span>
                  <span>{periodMessage}</span>
                </p>
              )}
              <button
                onClick={markAttendance}
                disabled={!canMarkAttendance}
                className={`w-full sm:w-auto px-4 py-2 rounded text-white focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                  canMarkAttendance 
                    ? 'bg-black hover:bg-gray-800 focus:ring-black' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                aria-label={canMarkAttendance ? 'Mark attendance' : 'Attendance marking not available'}
              >
                {canMarkAttendance ? 'Mark Attendance' : 'Attendance Window Closed'}
              </button>
              {!canMarkAttendance && (
                <p className="text-sm text-gray-600 mt-2">
                  Attendance can only be marked within the first minute of the period
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Daily Message */}
      {dailyMessage && (
        <section className="mb-8" aria-labelledby="daily-message-heading">
          <div className="border p-4 rounded shadow-sm">
            <h2 id="daily-message-heading" className="text-xl font-semibold mb-2">Daily Message</h2>
            <p>{dailyMessage}</p>
          </div>
        </section>
      )}

      {/* Attendance History */}
      <section aria-labelledby="attendance-history-heading">
        <h2 id="attendance-history-heading" className="text-xl font-semibold mb-4">Attendance History</h2>
        <div className="grid gap-4">
          {attendanceHistory.map((record) => (
            <article 
              key={record._id} 
              className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold">
                <time dateTime={record.date}>
                  {format(new Date(record.date), 'MMM dd, yyyy')}
                </time>
                {' - Period '}{record.period}
              </h3>
              <div className="mt-2 space-y-1">
                <p>
                  Status:{' '}
                  <span 
                    className={record.status === 'present' ? 'text-green-700' : 'text-red-700'}
                    aria-label={`Attendance status: ${record.status}`}
                  >
                    {record.status}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Marked at:{' '}
                  <time dateTime={record.timestamp}>
                    {format(new Date(record.timestamp), 'HH:mm:ss')}
                  </time>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default StudentDashboard; 