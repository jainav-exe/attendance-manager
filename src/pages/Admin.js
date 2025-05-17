import React from 'react';

function Admin() {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome to the admin dashboard. Here you can manage messages and timetable.</p>
      
      {/* Placeholder for admin controls */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Manage Messages</h3>
        <p>Message management controls will be displayed here.</p>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Manage Timetable</h3>
        <p>Timetable management controls will be displayed here.</p>
      </div>
    </div>
  );
}

export default Admin; 