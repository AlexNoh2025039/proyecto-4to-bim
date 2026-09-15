import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

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

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT postulacion_id, usuario_id, vacante_id, porcentaje_compatibilidad, fecha_postulacion, estado 
       FROM Postulacion 
       ORDER BY postulacion_id ASC`
    );
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
      `SELECT postulacion_id, usuario_id, vacante_id, porcentaje_compatibilidad, fecha_postulacion, estado 
       FROM Postulacion 
       WHERE postulacion_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Postulacion no encontrada' });
    }

    res.json({ postulacion: result.rows[0] });
  } catch (error) {
    console.error('Error consultando postulacion:', error);
    res.status(500).json({ message: 'No se pudo consultar la postulacion' });
  }
});

router.post('/', async (req, res) => {
  const { usuario_id, vacante_id, porcentaje_compatibilidad = 0, estado = 'Pendiente' } = req.body;
  const validationError = validatePostulacion({ usuario_id, vacante_id, porcentaje_compatibilidad, estado });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

  const { usuario_id, vacante_id, porcentaje_compatibilidad, estado } = req.body;
  const validationError = validatePostulacion({ usuario_id, vacante_id, porcentaje_compatibilidad, estado });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE Postulacion
       SET usuario_id = $1, vacante_id = $2, porcentaje_compatibilidad = $3, estado = $4
       WHERE postulacion_id = $5
       RETURNING postulacion_id, usuario_id, vacante_id, porcentaje_compatibilidad, fecha_postulacion, estado`,
      [usuario_id, vacante_id, porcentaje_compatibilidad, estado, id]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Postulacion no encontrada' });
    }

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

router.delete('/:id', async (req, res) => {
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