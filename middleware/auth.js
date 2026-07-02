const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const readData = (filename) => {
  const filepath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
};

const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Требуется авторизация' });
    }
    
    const config = readData('config.json');
    const userRoles = config.userRoles || {};
    const userRole = userRoles[userId] || 'user';
    
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Недостаточно прав' });
    }
    
    req.userRole = userRole;
    req.userId = userId;
    next();
  };
};

const isResourceAdmin = (req, res, next) => {
  const { resourceId } = req.params || req.body;
  const resources = readData('resources.json');
  const resource = resources.resources.find(r => r.id === resourceId);
  
  if (!resource) {
    return res.status(404).json({ success: false, error: 'Ресурс не найден' });
  }
  
  if (resource.adminId === req.userId || req.userRole === 'system_admin') {
    next();
  } else {
    return res.status(403).json({ success: false, error: 'Недостаточно прав для управления этим ресурсом' });
  }
};

module.exports = { checkRole, isResourceAdmin };
