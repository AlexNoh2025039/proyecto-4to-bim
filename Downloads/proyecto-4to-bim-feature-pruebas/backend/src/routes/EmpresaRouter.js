import { Router } from 'express';

import { pool } from '../db.js';

import {
  requireAuth,
  requireRole
} from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.use(
  requireRole('Administrador', 'Empresa')
);

function isValidEmail(email) {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

function normalizeOptional(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized === ''
    ? null
    : normalized;
}

function validateEmpresa({
  empresa_nombre,
  empresa_correo,
  empresa_telefono,
  empresa_nit,
  empresa_direccion
}) {

  if (
    typeof empresa_nombre !== 'string' ||
    !empresa_nombre.trim()
  ) {
    return 'El nombre de la empresa es obligatorio';
  }

  if (
    empresa_nombre.trim().length > 100
  ) {
    return 'El nombre de la empresa no puede superar los 100 caracteres';
  }


  if (
    typeof empresa_correo !== 'string' ||
    !empresa_correo.trim() ||
    !isValidEmail(empresa_correo.trim())
  ) {
    return 'El correo electrónico es obligatorio y debe tener un formato válido';
  }

  if (
    empresa_correo.trim().length > 100
  ) {
    return 'El correo no puede superar los 100 caracteres';
  }


  if (
    empresa_telefono !== null &&
    empresa_telefono !== undefined &&
    typeof empresa_telefono !== 'string'
  ) {
    return 'El teléfono debe ser un texto';
  }

  if (
    typeof empresa_telefono === 'string' &&
    empresa_telefono.trim().length > 20
  ) {
    return 'El teléfono no puede superar los 20 caracteres';
  }


  if (
    empresa_nit !== null &&
    empresa_nit !== undefined &&
    typeof empresa_nit !== 'string'
  ) {
    return 'El NIT debe ser un texto';
  }

  if (
    typeof empresa_nit === 'string' &&
    empresa_nit.trim().length > 30
  ) {
    return 'El NIT no puede superar los 30 caracteres';
  }


  if (
    empresa_direccion !== null &&
    empresa_direccion !== undefined &&
    typeof empresa_direccion !== 'string'
  ) {
    return 'La dirección debe ser un texto';
  }

  if (
    typeof empresa_direccion === 'string' &&
    empresa_direccion.trim().length > 250
  ) {
    return 'La dirección no puede superar los 250 caracteres';
  }


  return null;
}

async function validarUsuarioAdministrador(
  usuarioAdmin
) {

  if (
    !Number.isInteger(usuarioAdmin) ||
    usuarioAdmin <= 0
  ) {
    return {
      valido: false,
      status: 400,
      message:
        'El ID del usuario administrador debe ser un entero positivo'
    };
  }

  const result = await pool.query(
    `SELECT usuario_id, usuario_rol
     FROM Usuario
     WHERE usuario_id = $1`,
    [usuarioAdmin]
  );

  if (!result.rows[0]) {
    return {
      valido: false,
      status: 400,
      message:
        'El usuario administrador especificado no existe'
    };
  }

  if (
    result.rows[0].usuario_rol !== 'Empresa'
  ) {
    return {
      valido: false,
      status: 400,
      message:
        'El usuario administrador debe tener el rol Empresa'
    };
  }

  return {
    valido: true,
    usuario: result.rows[0]
  };
}

router.get('/', async (req, res) => {

  try {

    let result;

    if (
      req.user.usuario_rol === 'Administrador'
    ) {

      result = await pool.query(
        `SELECT
          empresa_id,
          empresa_nombre,
          empresa_descripcion,
          empresa_correo,
          empresa_telefono,
          empresa_nit,
          empresa_direccion,
          usuario_admin
         FROM Empresa
         ORDER BY empresa_id ASC`
      );

    } else {

      result = await pool.query(
        `SELECT
          empresa_id,
          empresa_nombre,
          empresa_descripcion,
          empresa_correo,
          empresa_telefono,
          empresa_nit,
          empresa_direccion,
          usuario_admin
         FROM Empresa
         WHERE usuario_admin = $1
         ORDER BY empresa_id ASC`,
        [req.user.usuario_id]
      );
    }

    res.json({
      empresas: result.rows
    });

  } catch (error) {

    console.error(
      'Error listando empresas:',
      error
    );

    res.status(500).json({
      message:
        'No se pudieron consultar las empresas'
    });
  }
});

router.get('/:id', async (req, res) => {

  const id = Number(req.params.id);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return res.status(400).json({
      message:
        'El ID de la empresa no es válido'
    });
  }

  try {

    const result = await pool.query(
      `SELECT
        empresa_id,
        empresa_nombre,
        empresa_descripcion,
        empresa_correo,
        empresa_telefono,
        empresa_nit,
        empresa_direccion,
        usuario_admin
       FROM Empresa
       WHERE empresa_id = $1`,
      [id]
    );

    const empresa = result.rows[0];

    if (!empresa) {
      return res.status(404).json({
        message: 'Empresa no encontrada'
      });
    }

    if (
      req.user.usuario_rol === 'Empresa' &&
      empresa.usuario_admin !== req.user.usuario_id
    ) {
      return res.status(403).json({
        message:
          'No tienes permiso para consultar esta empresa'
      });
    }

    res.json({
      empresa
    });

  } catch (error) {

    console.error(
      'Error consultando empresa:',
      error
    );

    res.status(500).json({
      message:
        'No se pudo consultar la empresa'
    });
  }
});

router.post('/', async (req, res) => {

  const {
    empresa_nombre,
    empresa_descripcion,
    empresa_correo,
    empresa_telefono,
    empresa_nit,
    empresa_direccion,
    usuario_admin
  } = req.body;


  const datos = {

    empresa_nombre,

    empresa_descripcion:
      normalizeOptional(
        empresa_descripcion
      ),

    empresa_correo,

    empresa_telefono:
      normalizeOptional(
        empresa_telefono
      ),

    empresa_nit:
      normalizeOptional(
        empresa_nit
      ),

    empresa_direccion:
      normalizeOptional(
        empresa_direccion
      )
  };


  const validationError =
    validateEmpresa(datos);

  if (validationError) {

    return res.status(400).json({
      message: validationError
    });
  }


  let usuarioAdminFinal;

  if (
    req.user.usuario_rol === 'Empresa'
  ) {

    usuarioAdminFinal =
      req.user.usuario_id;

  } else {

    usuarioAdminFinal =
      Number(usuario_admin);
  }


  try {

    const validacionAdmin =
      await validarUsuarioAdministrador(
        usuarioAdminFinal
      );

    if (!validacionAdmin.valido) {

      return res.status(
        validacionAdmin.status
      ).json({
        message:
          validacionAdmin.message
      });
    }


    const result = await pool.query(
      `INSERT INTO Empresa (
        empresa_nombre,
        empresa_descripcion,
        empresa_correo,
        empresa_telefono,
        empresa_nit,
        empresa_direccion,
        usuario_admin
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)

      RETURNING
        empresa_id,
        empresa_nombre,
        empresa_descripcion,
        empresa_correo,
        empresa_telefono,
        empresa_nit,
        empresa_direccion,
        usuario_admin`,
      [

        empresa_nombre.trim(),

        datos.empresa_descripcion,

        empresa_correo.trim().toLowerCase(),

        datos.empresa_telefono,

        datos.empresa_nit,

        datos.empresa_direccion,

        usuarioAdminFinal
      ]
    );


    res.status(201).json({
      empresa: result.rows[0]
    });

  } catch (error) {

    console.error(
      'Error creando empresa:',
      error
    );


    if (error.code === '23505') {

      return res.status(400).json({
        message:
          'El correo electrónico o el NIT ya están registrados'
      });
    }


    res.status(500).json({
      message:
        'No se pudo registrar la empresa'
    });
  }
});

router.put('/:id', async (req, res) => {

  const id = Number(req.params.id);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return res.status(400).json({
      message:
        'El ID de la empresa no es válido'
    });
  }


  const {
    empresa_nombre,
    empresa_descripcion,
    empresa_correo,
    empresa_telefono,
    empresa_nit,
    empresa_direccion,
    usuario_admin
  } = req.body;


  const datos = {

    empresa_nombre,

    empresa_correo,

    empresa_telefono:
      normalizeOptional(
        empresa_telefono
      ),

    empresa_nit:
      normalizeOptional(
        empresa_nit
      ),

    empresa_direccion:
      normalizeOptional(
        empresa_direccion
      )
  };


  const validationError =
    validateEmpresa(datos);

  if (validationError) {

    return res.status(400).json({
      message: validationError
    });
  }

  try {

    const empresaActual =
      await pool.query(
        `SELECT
          empresa_id,
          usuario_admin
         FROM Empresa
         WHERE empresa_id = $1`,
        [id]
      );

    if (!empresaActual.rows[0]) {

      return res.status(404).json({
        message:
          'Empresa no encontrada'
      });
    }

    const empresa = empresaActual.rows[0];

    if (
      req.user.usuario_rol === 'Empresa' &&
      empresa.usuario_admin !== req.user.usuario_id
    ) {

      return res.status(403).json({
        message:
          'No tienes permiso para modificar esta empresa'
      });
    }


    let usuarioAdminFinal =
      empresa.usuario_admin;

    if (
      req.user.usuario_rol === 'Administrador' &&
      usuario_admin !== undefined &&
      usuario_admin !== null
    ) {

      usuarioAdminFinal =
        Number(usuario_admin);
    }


    const validacionAdmin =
      await validarUsuarioAdministrador(
        usuarioAdminFinal
      );

    if (!validacionAdmin.valido) {

      return res.status(
        validacionAdmin.status
      ).json({
        message:
          validacionAdmin.message
      });
    }


    const result = await pool.query(
      `UPDATE Empresa
       SET
         empresa_nombre = $1,
         empresa_descripcion = $2,
         empresa_correo = $3,
         empresa_telefono = $4,
         empresa_nit = $5,
         empresa_direccion = $6,
         usuario_admin = $7
       WHERE empresa_id = $8

       RETURNING
         empresa_id,
         empresa_nombre,
         empresa_descripcion,
         empresa_correo,
         empresa_telefono,
         empresa_nit,
         empresa_direccion,
         usuario_admin`,

      [

        empresa_nombre.trim(),

        normalizeOptional(
          empresa_descripcion
        ),

        empresa_correo
          .trim()
          .toLowerCase(),

        datos.empresa_telefono,

        datos.empresa_nit,

        datos.empresa_direccion,

        usuarioAdminFinal,

        id
      ]
    );


    res.json({
      empresa: result.rows[0]
    });

  } catch (error) {

    console.error(
      'Error actualizando empresa:',
      error
    );


    if (error.code === '23505') {

      return res.status(400).json({
        message:
          'El correo electrónico o el NIT ya pertenecen a otra empresa'
      });
    }

    res.status(500).json({
      message:
        'No se pudo actualizar la empresa'
    });
  }
});

router.delete('/:id', async (req, res) => {

  const id = Number(req.params.id);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return res.status(400).json({
      message:
        'El ID de la empresa no es válido'
    });
  }


  try {

    const empresaResult =
      await pool.query(
        `SELECT
          empresa_id,
          usuario_admin
         FROM Empresa
         WHERE empresa_id = $1`,
        [id]
      );


    const empresa =
      empresaResult.rows[0];


    if (!empresa) {

      return res.status(404).json({
        message:
          'Empresa no encontrada'
      });
    }

    if (
      req.user.usuario_rol === 'Empresa' &&
      empresa.usuario_admin !== req.user.usuario_id
    ) {

      return res.status(403).json({
        message:
          'No tienes permiso para eliminar esta empresa'
      });
    }

    const result =
      await pool.query(
        `DELETE FROM Empresa
         WHERE empresa_id = $1
         RETURNING empresa_id`,
        [id]
      );

    res.json({
      message:
        'Empresa eliminada correctamente'
    });

  } catch (error) {

    console.error(
      'Error eliminando empresa:',
      error
    );

    res.status(500).json({
      message:
        'No se pudo eliminar la empresa'
    });
  }
});


export default router;