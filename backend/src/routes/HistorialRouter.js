import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function validateHistorial({ descripcion, postulacion_id }) {
  if (typeof descripcion !== 'string' || !descripcion.trim()) {
    return 'La descripcion es obligatoria';
  }

  if (descripcion.trim().length > 255) {
    return 'La descripcion no puede superar los 255 caracteres';
  }

  if (!Number.isInteger(postulacion_id) || postulacion_id <= 0) {
    return 'El ID de la postulacion debe ser un entero positivo';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT historial_id, descripcion, fecha, postulacion_id 
       FROM Historial 
       ORDER BY historial_id ASC`
    );
    res.json({ historial: result.rows });
  } catch (error) {
    console.error('Error listando historial:', error);
    res.status(500).json({ message: 'No se pudo consultar el historial' });
  }
});

router.get('/postulacion/:postulacion_id', async (req, res) => {
  const postulacion_id = Number(req.params.postulacion_id);

  if (!Number.isInteger(postulacion_id) || postulacion_id <= 0) {
    return res.status(400).json({ message: 'El ID de la postulacion no es valido' });
  }

  try {
    const result = await pool.query(
      `SELECT historial_id, descripcion, fecha, postulacion_id 
       FROM Historial 
       WHERE postulacion_id = $1 
       ORDER BY fecha DESC`,
      [postulacion_id]
    );

    res.json({ historial: result.rows });
  } catch (error) {
    console.error('Error consultando historial por postulacion:', error);
    res.status(500).json({ message: 'No se pudo consultar el historial de la postulacion' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID del historial no es valido' });
  }

  try {
    const result = await pool.query(
      `SELECT historial_id, descripcion, fecha, postulacion_id 
       FROM Historial 
       WHERE historial_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Registro de historial no encontrado' });
    }

    res.json({ historial: result.rows[0] });
  } catch (error) {
    console.error('Error consultando registro de historial:', error);
    res.status(500).json({ message: 'No se pudo consultar el registro de historial' });
  }
});

router.post('/', async (req, res) => {
  const { descripcion, postulacion_id } = req.body;
  const validationError = validateHistorial({ descripcion, postulacion_id });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Historial (descripcion, postulacion_id)
       VALUES ($1, $2)
       RETURNING historial_id, descripcion, fecha, postulacion_id`,
      [descripcion.trim(), postulacion_id]
    );
    res.status(201).json({ historial: result.rows[0] });
  } catch (error) {
    console.error('Error creando historial:', error);
    res.status(500).json({ message: 'No se pudo crear el registro en el historial' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID del historial no es valido' });
  }

  const { descripcion, postulacion_id } = req.body;
  const validationError = validateHistorial({ descripcion, postulacion_id });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE Historial
       SET descripcion = $1, postulacion_id = $2
       WHERE historial_id = $3
       RETURNING historial_id, descripcion, fecha, postulacion_id`,
      [descripcion.trim(), postulacion_id, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Registro de historial no encontrado' });
    }

    res.json({ historial: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando historial:', error);
    res.status(500).json({ message: 'No se pudo actualizar el registro de historial' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID del historial no es valido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Historial WHERE historial_id = $1 RETURNING historial_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Registro de historial no encontrado' });
    }

    res.json({ message: 'Registro de historial eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando historial:', error);
    res.status(500).json({ message: 'No se pudo eliminar el registro de historial' });
  }
});

export default router;