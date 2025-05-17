db = db.getSiblingDB('attendance-manager');

// Create admin user
db.createUser({
  user: 'admin',
  pwd: 'admin_password', // Change this in production
  roles: [
    { role: 'readWrite', db: 'attendance-manager' },
    { role: 'dbAdmin', db: 'attendance-manager' }
  ]
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.attendance.createIndex({ userId: 1, date: 1 });
db.attendance.createIndex({ period: 1, date: 1 });
db.messages.createIndex({ date: 1 }, { unique: true });
db.timetable.createIndex({ lastUpdated: 1 }); 