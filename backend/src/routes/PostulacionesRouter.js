import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

function validatePostulacion({ usuario_id, vacante_id, estado }) {
  if (!Number.isInteger(Number(usuario_id)) || Number(usuario_id) <= 0) {
    return 'Debes ingresar un ID de usuario válido';
  }

  if (!Number.isInteger(Number(vacante_id)) || Number(vacante_id) <= 0) {
    return 'Debes ingresar un ID de vacante válido';
  }

  const estadosValidos = ['Pendiente', 'En Revision', 'Aceptado', 'Rechazado'];
  if (estado && !estadosValidos.includes(estado)) {
    return 'El estado ingresado no es válido';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Postulacion ORDER BY postulacion_id ASC');
    res.json({ postulaciones: rows });
  } catch (error) {
    console.error('Error al consultar postulaciones:', error);
    res.status(500).json({ message: 'No fue posible obtener la lista de postulaciones' });
  }
});

router.get('/usuario/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM Postulacion WHERE usuario_id = ?', [usuario_id]);
    res.json({ postulaciones: rows });
  } catch (error) {
    console.error('Error al consultar postulaciones del usuario:', error);
    res.status(500).json({ message: 'Error al obtener las postulaciones de este usuario' });
  }
});

router.post('/', async (req, res) => {
  const { usuario_id, vacante_id, estado } = req.body;
  const validationError = validatePostulacion({ usuario_id, vacante_id, estado });

  if (validationError !== null) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO Postulacion (usuario_id, vacante_id, estado)
       VALUES (?, ?, ?)`,
      [usuario_id, vacante_id, estado || 'Pendiente']
    );

    const [newPostulacion] = await pool.query('SELECT * FROM Postulacion WHERE postulacion_id = ?', [result.insertId]);
    res.status(201).json({ postulacion: newPostulacion[0] });
  } catch (error) {
    console.error('Error al registrar la postulación:', error);
    res.status(500).json({ message: 'No se pudo guardar la postulación' });
  }
});

router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['Pendiente', 'En Revision', 'Aceptado', 'Rechazado'];
  if (!estado || !estadosValidos.includes(estado)) {
    return res.status(400).json({ message: 'Ingresa un estado válido para actualizar' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE Postulacion SET estado = ? WHERE postulacion_id = ?',
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró la postulación para actualizar' });
    }

    const [updated] = await pool.query('SELECT * FROM Postulacion WHERE postulacion_id = ?', [id]);
    res.json({ postulacion: updated[0] });
  } catch (error) {
    console.error('Error al modificar el estado de la postulación:', error);
    res.status(500).json({ message: 'No se pudo actualizar el estado' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Postulacion WHERE postulacion_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró la postulación a borrar' });
    }

    res.json({ message: 'La postulación fue eliminada con éxito' });
  } catch (error) {
    console.error('Error al borrar la postulación:', error);
    res.status(500).json({ message: 'No fue posible eliminar la postulación' });
  }
});

export default router;