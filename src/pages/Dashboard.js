import React from 'react';

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard. Here you'll find your timetable and attendance information.</p>
      {/* Placeholder for timetable and attendance components */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Today's Schedule</h3>
        <p>Schedule information will be displayed here.</p>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h3>Attendance Overview</h3>
        <p>Attendance statistics will be displayed here.</p>
      </div>
    </div>
  );
}

export default Dashboard; 