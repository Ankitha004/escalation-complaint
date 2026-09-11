const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }

    const userRole = (req.user.role || '').trim().toLowerCase();
    const allowedRoles = roles.map(r => r.trim().toLowerCase());

    if (userRole === 'super admin' || userRole === 'superadmin') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    
    next();
  };
};

module.exports = { authorize };
