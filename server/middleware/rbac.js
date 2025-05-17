const { ForbiddenError } = require('../utils/errors');

// Define available roles and their permissions
const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_TIMETABLE: 'manage_timetable',
  MANAGE_MESSAGES: 'manage_messages',
  VIEW_ATTENDANCE: 'view_attendance',
  MARK_ATTENDANCE: 'mark_attendance',
  VIEW_MESSAGES: 'view_messages'
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_TIMETABLE,
    PERMISSIONS.MANAGE_MESSAGES,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_MESSAGES
  ],
  [ROLES.TEACHER]: [
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_MESSAGES
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_MESSAGES
  ]
};

// Middleware to check if user has required role
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

// Middleware to check if user has required permission
const hasPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  hasRole,
  hasPermission
}; 