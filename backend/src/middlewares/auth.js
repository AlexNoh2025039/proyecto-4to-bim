import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {

  const header =
    req.headers.authorization;

  if (
    !header ||
    !header.startsWith('Bearer ')
  ) {

    return res.status(401).json({
      message:
        'No autorizado: falta el token'
    });
  }


  const token =
    header.slice(7);


  const secretKey =
    process.env.JWT_SECRET;


  if (!secretKey) {

    console.error(
      'JWT_SECRET no está configurado'
    );

    return res.status(500).json({
      message:
        'El servidor no tiene configurada la clave de seguridad'
    });
  }


  try {

    const payload =
      jwt.verify(
        token,
        secretKey
      );

    req.user =
      payload;

    next();

  } catch {

    return res.status(401).json({
      message:
        'No autorizado: token inválido o expirado'
    });
  }
}


export function requireRole(
  ...rolesPermitidos
) {

  return (req, res, next) => {

    if (!req.user) {

      return res.status(401).json({
        message:
          'No autorizado: usuario no identificado'
      });
    }


    if (
      !rolesPermitidos.includes(
        req.user.usuario_rol
      )
    ) {

      return res.status(403).json({
        message:
          `Acceso denegado: se requiere uno de los siguientes roles [${rolesPermitidos.join(', ')}]`
      });
    }


    next();
  };
}