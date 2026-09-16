import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado: falta el token' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'No autorizado: token inválido o expirado' });
  }
}

export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado: usuario no identificado' });
    }

    if (!rolesPermitidos.includes(req.user.usuario_rol)) {
      return res.status(403).json({ 
        message: `Acceso denegado: se requiere uno de los siguientes roles [${rolesPermitidos.join(', ')}]` 
      });
    }

    next();
  };
}