const permissionsMatrix = {
  Admin: [
    'create_user',
    'delete_user',
    'assign_task',
    'approve_leave',
    'view_reports',
    'manage_roles'
  ],
  Manager: [
    'assign_task',
    'approve_leave',
    'view_team'
  ],
  Employee: [
    'view_task',
    'update_task',
    'apply_leave'
  ]
};

exports.authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Not authorized, no role assigned' });
    }

    const userPermissions = permissionsMatrix[req.user.role] || [];
    
    // Admins implicitly get all permissions (optional, but standard)
    if (req.user.role === 'Admin' || userPermissions.includes(requiredPermission)) {
      next();
    } else {
      return res.status(403).json({ message: `Forbidden: requires '${requiredPermission}' permission` });
    }
  };
};
