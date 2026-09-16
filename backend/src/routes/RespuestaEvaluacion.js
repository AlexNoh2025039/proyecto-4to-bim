import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function validateRespuestaEvaluacion({ usuario_id, evaluacion_id, nota_final }) {
  if (!Number.isInteger(usuario_id) || usuario_id <= 0) {
    return 'El ID de usuario debe ser un entero positivo';
  }

  if (!Number.isInteger(evaluacion_id) || evaluacion_id <= 0) {
    return 'El ID de evaluacion debe ser un entero positivo';
  }

  if (
    nota_final !== undefined &&
    (typeof nota_final !== 'number' || isNaN(nota_final) || nota_final < 0)
  ) {
    return 'La nota final debe ser un numero valido mayor o igual a 0';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT respuesta_id, usuario_id, evaluacion_id, nota_final, fecha_realizacion 
       FROM RespuestaEvaluacion 
       ORDER BY respuesta_id ASC`
    );

    res.json({ respuestas: result.rows });
  } catch (error) {
    console.error('Error listando respuestas de evaluacion:', error);
    res.status(500).json({ message: 'No se pudieron consultar las respuestas de evaluacion' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la respuesta no es valido' });
  }

  try {
    const result = await pool.query(
      `SELECT respuesta_id, usuario_id, evaluacion_id, nota_final, fecha_realizacion 
       FROM RespuestaEvaluacion 
       WHERE respuesta_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Respuesta de evaluacion no encontrada' });
    }

    res.json({ respuesta: result.rows[0] });
  } catch (error) {
    console.error('Error consultando respuesta de evaluacion:', error);
    res.status(500).json({ message: 'No se pudo consultar la respuesta de evaluacion' });
  }
});

router.post('/', async (req, res) => {
  const { usuario_id, evaluacion_id, nota_final = 0.00 } = req.body;

  const validationError = validateRespuestaEvaluacion({ usuario_id, evaluacion_id, nota_final });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO RespuestaEvaluacion (usuario_id, evaluacion_id, nota_final)
       VALUES ($1, $2, $3)
       RETURNING respuesta_id, usuario_id, evaluacion_id, nota_final, fecha_realizacion`,
      [usuario_id, evaluacion_id, nota_final]
    );

    res.status(201).json({ respuesta: result.rows[0] });
  } catch (error) {
    console.error('Error creando respuesta de evaluacion:', error);
    res.status(500).json({ message: 'No se pudo crear la respuesta de evaluacion' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la respuesta no es valido' });
  }

  const { usuario_id, evaluacion_id, nota_final } = req.body;

  const validationError = validateRespuestaEvaluacion({ usuario_id, evaluacion_id, nota_final });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE RespuestaEvaluacion
       SET usuario_id = $1, evaluacion_id = $2, nota_final = $3
       WHERE respuesta_id = $4
       RETURNING respuesta_id, usuario_id, evaluacion_id, nota_final, fecha_realizacion`,
      [usuario_id, evaluacion_id, nota_final, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Respuesta de evaluacion no encontrada' });
    }

    res.json({ respuesta: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando respuesta de evaluacion:', error);
    res.status(500).json({ message: 'No se pudo actualizar la respuesta de evaluacion' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la respuesta no es valido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM RespuestaEvaluacion WHERE respuesta_id = $1 RETURNING respuesta_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Respuesta de evaluacion no encontrada' });
    }

    res.json({ message: 'Respuesta de evaluacion eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando respuesta de evaluacion:', error);
    res.status(500).json({ message: 'No se pudo eliminar la respuesta de evaluacion' });
  }
});

export default router;