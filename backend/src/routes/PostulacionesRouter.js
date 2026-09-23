import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

function validatePostulacion({ usuario_id, vacante_id, porcentaje_compatibilidad, estado }) {
  if (!Number.isInteger(usuario_id) || usuario_id <= 0) {
    return 'El ID de usuario debe ser un entero positivo';
  }

  if (!Number.isInteger(vacante_id) || vacante_id <= 0) {
    return 'El ID de vacante debe ser un entero positivo';
  }

  if (
    porcentaje_compatibilidad !== undefined &&
    (!Number.isInteger(porcentaje_compatibilidad) || porcentaje_compatibilidad < 0 || porcentaje_compatibilidad > 100)
  ) {
    return 'El porcentaje de compatibilidad debe ser un entero entre 0 y 100';
  }

  const estadosValidos = ['Pendiente', 'En Revision', 'Aceptado', 'Rechazado'];
  if (estado !== undefined && !estadosValidos.includes(estado)) {
    return `El estado debe ser uno de los siguientes: ${estadosValidos.join(', ')}`;
  }

  return null;
}

router.get('/', async (req, res) => {
  try {
    const baseSelect = `
      SELECT
        p.postulacion_id,
        p.usuario_id,
        p.vacante_id,
        p.porcentaje_compatibilidad,
        p.fecha_postulacion,
        p.estado,
        v.vacante_nombre,
        v.tipo_jornada,
        v.ubicacion,
        e.empresa_nombre
      FROM Postulacion p
      JOIN Vacante v ON v.vacante_id = p.vacante_id
      JOIN Empresa e ON e.empresa_id = v.empresa_id
    `;

    let result;

    if (req.user.usuario_rol === 'Administrador') {
      result = await pool.query(`${baseSelect} ORDER BY p.postulacion_id ASC`);
    } else if (req.user.usuario_rol === 'Candidato') {
      result = await pool.query(
        `${baseSelect} WHERE p.usuario_id = $1 ORDER BY p.postulacion_id ASC`,
        [req.user.usuario_id]
      );
    } else {
      result = await pool.query(
        `${baseSelect} WHERE e.usuario_admin = $1 ORDER BY p.postulacion_id ASC`,
        [req.user.usuario_id]
      );
    }

    res.json({ postulaciones: result.rows });
  } catch (error) {
    console.error('Error listando postulaciones:', error);
    res.status(500).json({ message: 'No se pudieron consultar las postulaciones' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la postulacion no es valido' });
  }

  try {
    const result = await pool.query(
      `SELECT p.postulacion_id, p.usuario_id, p.vacante_id, p.porcentaje_compatibilidad, p.fecha_postulacion, p.estado, v.empresa_id
       FROM Postulacion p
       JOIN Vacante v ON v.vacante_id = p.vacante_id
       WHERE p.postulacion_id = $1`,
      [id]
    );

    const postulacion = result.rows[0];

    if (!postulacion) {
      return res.status(404).json({ message: 'Postulacion no encontrada' });
    }

    if (req.user.usuario_rol === 'Candidato' && postulacion.usuario_id !== req.user.usuario_id) {
      return res.status(403).json({ message: 'No tienes permiso para consultar esta postulación' });
    }

    if (req.user.usuario_rol === 'Empresa') {
      const miEmpresa = await pool.query('SELECT empresa_id FROM Empresa WHERE usuario_admin = $1', [req.user.usuario_id]);
      if (miEmpresa.rows[0]?.empresa_id !== postulacion.empresa_id) {
        return res.status(403).json({ message: 'No tienes permiso para consultar esta postulación' });
      }
    }

    delete postulacion.empresa_id;
    res.json({ postulacion });
  } catch (error) {
    console.error('Error consultando postulacion:', error);
    res.status(500).json({ message: 'No se pudo consultar la postulacion' });
  }
});

router.post('/', requireRole('Candidato'), async (req, res) => {
  const { vacante_id, porcentaje_compatibilidad = 0 } = req.body;
  const usuario_id = req.user.usuario_id; 
  const estado = 'Pendiente';

  const validationError = validatePostulacion({ usuario_id, vacante_id, porcentaje_compatibilidad, estado });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vacanteExiste = await client.query(
      'SELECT vacante_id FROM Vacante WHERE vacante_id = $1 AND estado = TRUE',
      [vacante_id]
    );

    if (!vacanteExiste.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'La vacante especificada no existe o no está activa' });
    }

    const yaExiste = await client.query(
      'SELECT postulacion_id FROM Postulacion WHERE usuario_id = $1 AND vacante_id = $2',
      [usuario_id, vacante_id]
    );

    if (yaExiste.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Ya te has postulado a esta vacante' });
    }

    const resultPostulacion = await client.query(
      `INSERT INTO Postulacion (usuario_id, vacante_id, porcentaje_compatibilidad, estado)
       VALUES ($1, $2, $3, $4)
       RETURNING postulacion_id, usuario_id, vacante_id, porcentaje_compatibilidad, fecha_postulacion, estado`,
      [usuario_id, vacante_id, porcentaje_compatibilidad, estado]
    );

    const nuevaPostulacion = resultPostulacion.rows[0];

    await client.query(
      `INSERT INTO Historial (descripcion, postulacion_id)
       VALUES ($1, $2)`,
      [`Postulacion creada con estado: ${estado}`, nuevaPostulacion.postulacion_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ postulacion: nuevaPostulacion });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creando postulacion:', error);
    res.status(500).json({ message: 'No se pudo crear la postulacion' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la postulacion no es valido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const actual = await client.query(
      `SELECT p.postulacion_id, p.usuario_id, p.vacante_id, p.porcentaje_compatibilidad, p.estado, v.empresa_id
       FROM Postulacion p
       JOIN Vacante v ON v.vacante_id = p.vacante_id
       WHERE p.postulacion_id = $1`,
      [id]
    );

    const postulacionActual = actual.rows[0];

    if (!postulacionActual) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Postulacion no encontrada' });
    }

    let usuario_id = postulacionActual.usuario_id;
    let vacante_id = postulacionActual.vacante_id;
    let porcentaje_compatibilidad = postulacionActual.porcentaje_compatibilidad;
    let estado = postulacionActual.estado;

    if (req.user.usuario_rol === 'Administrador') {
      usuario_id = req.body.usuario_id ?? usuario_id;
      vacante_id = req.body.vacante_id ?? vacante_id;
      porcentaje_compatibilidad = req.body.porcentaje_compatibilidad ?? porcentaje_compatibilidad;
      estado = req.body.estado ?? estado;

    } else if (req.user.usuario_rol === 'Empresa') {
      const miEmpresa = await client.query(
        'SELECT empresa_id FROM Empresa WHERE usuario_admin = $1',
        [req.user.usuario_id]
      );

      if (miEmpresa.rows[0]?.empresa_id !== postulacionActual.empresa_id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'No tienes permiso para modificar esta postulación' });
      }

      estado = req.body.estado ?? estado;
      porcentaje_compatibilidad = req.body.porcentaje_compatibilidad ?? porcentaje_compatibilidad;

    } else if (req.user.usuario_rol === 'Candidato') {
      if (postulacionActual.usuario_id !== req.user.usuario_id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'No tienes permiso para modificar esta postulación' });
      }

      if (req.body.estado !== 'Rechazado') {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Como candidato solo puedes cancelar tu postulación' });
      }

      if (postulacionActual.estado === 'Aceptado') {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'No puedes cancelar una postulación ya aceptada' });
      }

      estado = 'Rechazado';
    }

    const validationError = validatePostulacion({ usuario_id, vacante_id, porcentaje_compatibilidad, estado });

    if (validationError) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: validationError });
    }

    const result = await client.query(
      `UPDATE Postulacion
       SET usuario_id = $1, vacante_id = $2, porcentaje_compatibilidad = $3, estado = $4
       WHERE postulacion_id = $5
       RETURNING postulacion_id, usuario_id, vacante_id, porcentaje_compatibilidad, fecha_postulacion, estado`,
      [usuario_id, vacante_id, porcentaje_compatibilidad, estado, id]
    );

    const postulacionActualizada = result.rows[0];

    await client.query(
      `INSERT INTO Historial (descripcion, postulacion_id)
       VALUES ($1, $2)`,
      [`Postulacion actualizada a estado: ${estado}`, id]
    );

    await client.query('COMMIT');
    res.json({ postulacion: postulacionActualizada });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error actualizando postulacion:', error);
    res.status(500).json({ message: 'No se pudo actualizar la postulacion' });
  } finally {
    client.release();
  }
});

router.delete('/:id', requireRole('Administrador'), async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la postulacion no es valido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Postulacion WHERE postulacion_id = $1 RETURNING postulacion_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Postulacion no encontrada' });
    }

    res.json({ message: 'Postulacion eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando postulacion:', error);
    res.status(500).json({ message: 'No se pudo eliminar la postulación' });
  }
});

export default router;