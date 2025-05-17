import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [dailyMessage, setDailyMessage] = useState('');
  const [periodMessages, setPeriodMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, timetableRes, messagesRes] = await Promise.all([
        axios.get(`/api/attendance/stats/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        axios.get('/api/timetable'),
        axios.get('/api/messages/periods')
      ]);

      setAttendanceData(attendanceRes.data);
      setTimetable(timetableRes.data);
      setPeriodMessages(messagesRes.data);
    } catch (error) {
      setError('Error fetching data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimetableUpdate = async (periodIndex, field, value) => {
    try {
      const updatedTimetable = [...timetable];
      updatedTimetable[periodIndex] = {
        ...updatedTimetable[periodIndex],
        [field]: value
      };
      
      await axios.put('/api/timetable', updatedTimetable);
      setTimetable(updatedTimetable);
    } catch (error) {
      setError('Error updating timetable');
    }
  };

  const handleMessageUpdate = async (periodIndex, message) => {
    try {
      const updatedMessages = [...periodMessages];
      updatedMessages[periodIndex] = {
        ...updatedMessages[periodIndex],
        message
      };
      
      await axios.put('/api/timetable', timetable.map((period, index) => ({
        ...period,
        message: updatedMessages[index].message
      })));
      
      setPeriodMessages(updatedMessages);
    } catch (error) {
      setError('Error updating message');
    }
  };

  const handleDailyMessageUpdate = async (message) => {
    try {
      await axios.put('/api/messages/daily', { message });
      setDailyMessage(message);
    } catch (error) {
      setError('Error updating daily message');
    }
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Period', 'Present', 'Absent', 'Total'];
    const csvData = attendanceData.map(record => [
      record._id.date,
      record._id.period,
      record.stats.find(s => s.status === 'present')?.count || 0,
      record.stats.find(s => s.status === 'absent')?.count || 0,
      record.stats.reduce((sum, stat) => sum + stat.count, 0)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Attendance Report</h2>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="border p-2 rounded"
          />
          <button
            onClick={downloadCSV}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Attendance Report */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendanceData.map((record) => (
            <div key={`${record._id.date}-${record._id.period}`} className="border p-4 rounded">
              <h3 className="font-semibold">
                {format(new Date(record._id.date), 'MMM dd, yyyy')} - Period {record._id.period}
              </h3>
              <div className="mt-2">
                <p>Present: {record.stats.find(s => s.status === 'present')?.count || 0}</p>
                <p>Absent: {record.stats.find(s => s.status === 'absent')?.count || 0}</p>
                <p>Total: {record.stats.reduce((sum, stat) => sum + stat.count, 0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timetable Management */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Timetable Management</h2>
        <div className="grid gap-4">
          {timetable.map((period, index) => (
            <div key={index} className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Period {index + 1}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Start Time</label>
                  <input
                    type="time"
                    value={period.startTime}
                    onChange={(e) => handleTimetableUpdate(index, 'startTime', e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Time</label>
                  <input
                    type="time"
                    value={period.endTime}
                    onChange={(e) => handleTimetableUpdate(index, 'endTime', e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Period Message</label>
                  <textarea
                    value={periodMessages[index]?.message || ''}
                    onChange={(e) => handleMessageUpdate(index, e.target.value)}
                    className="border p-2 rounded w-full"
                    rows="2"
                    placeholder="Enter period message..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Message */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Daily Message</h2>
        <textarea
          value={dailyMessage}
          onChange={(e) => handleDailyMessageUpdate(e.target.value)}
          className="border p-2 rounded w-full"
          rows="3"
          placeholder="Enter daily message..."
        />
      </div>
    </div>
  );
};

export default AdminDashboard; 