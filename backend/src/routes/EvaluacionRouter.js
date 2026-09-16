import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function validateEvaluacion({ evaluacion_nombre, categoria, empresa_id, pregunta_id }) {
    if (!evaluacion_nombre || typeof evaluacion_nombre !== 'string' || evaluacion_nombre.trim() === '' || evaluacion_nombre.length > 100){
        return 'El nombre de la evalución no es valido';
    }

    if (!categoria || typeof categoria !== 'string' || categoria.trim() === '' || categoria.length > 100){
        return 'El nombre de la evalución no es valido';
    }

    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        return 'El id de la empresa no es valido';
    }

    if (!Number.isInteger(pregunta_id) || pregunta_id <= 0){
        return 'El id de la pregunta no es valido';
    }

    return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT evaluacion_id, evaluacion_nombre, categoria, empresa_id, pregunta_id 
       FROM Evaluacion 
       ORDER BY evaluacion_id ASC`
    );

    res.json({ evaluaciones: result.rows });
  } catch (error) {
    console.error('Error listando evaluaciones:', error);
    res.status(500).json({ message: 'No se pudieron consultar las evaluaciones' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la evaluacion no es valido' });
  }

  try {
    const result = await pool.query(
      `SELECT evaluacion_id, evaluacion_nombre, categoria, empresa_id, pregunta_id 
       FROM Evaluacion 
       WHERE evaluacion_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Evaluacion no encontrada' });
    }

    res.json({ evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error consultando evaluacion:', error);
    res.status(500).json({ message: 'No se pudo consultar la evaluacion' });
  }
});

router.post('/', async (req, res) => {
  const { evaluacion_nombre, categoria, empresa_id, pregunta_id } = req.body;

  const validationError = validateEvaluacion({ evaluacion_nombre, categoria, empresa_id, pregunta_id });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Evaluacion (evaluacion_nombre, categoria, empresa_id, pregunta_id)
       VALUES ($1, $2, $3, $4)
       RETURNING evaluacion_id, evaluacion_nombre, categoria, empresa_id, pregunta_id`,
      [evaluacion_nombre.trim(), categoria.trim(), empresa_id, pregunta_id]
    );

    res.status(201).json({ evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error creando evaluacion:', error);
    res.status(500).json({ message: 'No se pudo crear la evaluacion' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la evaluacion no es valido' });
  }

  const { evaluacion_nombre, categoria, empresa_id, pregunta_id } = req.body;

  const validationError = validateEvaluacion({ evaluacion_nombre, categoria, empresa_id, pregunta_id });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE Evaluacion
       SET evaluacion_nombre = $1, categoria = $2, empresa_id = $3, pregunta_id = $4
       WHERE evaluacion_id = $5
       RETURNING evaluacion_id, evaluacion_nombre, categoria, empresa_id, pregunta_id`,
      [evaluacion_nombre.trim(), categoria.trim(), empresa_id, pregunta_id, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Evaluacion no encontrada' });
    }

    res.json({ evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando evaluacion:', error);
    res.status(500).json({ message: 'No se pudo actualizar la evaluacion' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la evaluacion no es valido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Evaluacion WHERE evaluacion_id = $1 RETURNING evaluacion_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Evaluacion no encontrada' });
    }

    res.json({ message: 'Evaluacion eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando evaluacion:', error);
    res.status(500).json({ message: 'No se pudo eliminar la evaluacion' });
  }
});

export default router;