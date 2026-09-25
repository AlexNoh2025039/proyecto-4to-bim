import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

function validateEvaluacion({ evaluacion_nombre, categoria, empresa_id }) {
  if (
    !evaluacion_nombre ||
    typeof evaluacion_nombre !== 'string' ||
    evaluacion_nombre.trim() === '' ||
    evaluacion_nombre.length > 100
  ) {
    return 'El nombre de la evaluación es obligatorio y no debe superar los 100 caracteres';
  }

  if (categoria && (typeof categoria !== 'string' || categoria.length > 100)) {
    return 'La categoría debe ser un texto de máximo 100 caracteres';
  }

  const id = Number(empresa_id);
  if (!Number.isInteger(id) || id <= 0) {
    return 'El empresa_id debe ser un número entero válido';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.evaluacion_id, e.evaluacion_nombre, e.categoria, e.empresa_id, emp.empresa_nombre
       FROM Evaluacion e
       JOIN Empresa emp ON e.empresa_id = emp.empresa_id
       ORDER BY e.evaluacion_id ASC`
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
    return res.status(400).json({ message: 'El ID de la evaluación no es válido' });
  }

  try {
    const result = await pool.query(
      `SELECT e.evaluacion_id, e.evaluacion_nombre, e.categoria, e.empresa_id, emp.empresa_nombre
       FROM Evaluacion e
       JOIN Empresa emp ON e.empresa_id = emp.empresa_id
       WHERE e.evaluacion_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    res.json({ evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error consultando evaluación:', error);
    res.status(500).json({ message: 'No se pudo consultar la evaluación' });
  }
});

router.post('/', async (req, res) => {
  const { evaluacion_nombre, categoria, empresa_id } = req.body;

  const validationError = validateEvaluacion({ evaluacion_nombre, categoria, empresa_id });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const empresaExiste = await pool.query('SELECT empresa_id FROM Empresa WHERE empresa_id = $1', [empresa_id]);
    if (!empresaExiste.rows[0]) {
      return res.status(400).json({ message: 'La empresa especificada no existe' });
    }

    const result = await pool.query(
      `INSERT INTO Evaluacion (evaluacion_nombre, categoria, empresa_id)
       VALUES ($1, $2, $3)
       RETURNING evaluacion_id, evaluacion_nombre, categoria, empresa_id`,
      [evaluacion_nombre.trim(), categoria ? categoria.trim() : null, empresa_id]
    );

    res.status(201).json({ evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error creando evaluación:', error);
    res.status(500).json({ message: 'No se pudo crear la evaluación' });
  }
});

// NUEVO ENDPOINT PARA GUARDAR RESULTADOS DE CANDIDATOS
router.post('/resultados', async (req, res) => {
  const { candidato_id, evaluacion_id, puntaje, porcentaje, aprobado } = req.body;

  if (!candidato_id || !evaluacion_id || puntaje === undefined || porcentaje === undefined || aprobado === undefined) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para guardar el resultado' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO ResultadoEvaluacion (usuario_id, evaluacion_id, puntaje, porcentaje, aprobado, fecha_realizacion)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [candidato_id, evaluacion_id, puntaje, porcentaje, aprobado]
    );

    res.status(201).json({
      message: 'Resultado guardado correctamente',
      resultado: result.rows[0]
    });
  } catch (error) {
    console.error('Error al guardar el resultado de la evaluación:', error);
    res.status(500).json({
      message: 'No se pudo guardar el resultado en la base de datos.',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la evaluación no es válido' });
  }

  const { evaluacion_nombre, categoria, empresa_id } = req.body;

  const validationError = validateEvaluacion({ evaluacion_nombre, categoria, empresa_id });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const empresaExiste = await pool.query('SELECT empresa_id FROM Empresa WHERE empresa_id = $1', [empresa_id]);
    if (!empresaExiste.rows[0]) {
      return res.status(400).json({ message: 'La empresa especificada no existe' });
    }

    const result = await pool.query(
      `UPDATE Evaluacion
       SET evaluacion_nombre = $1, categoria = $2, empresa_id = $3
       WHERE evaluacion_id = $4
       RETURNING evaluacion_id, evaluacion_nombre, categoria, empresa_id`,
      [evaluacion_nombre.trim(), categoria ? categoria.trim() : null, empresa_id, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    res.json({ evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando evaluación:', error);
    res.status(500).json({ message: 'No se pudo actualizar la evaluación' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la evaluación no es válido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Evaluacion WHERE evaluacion_id = $1 RETURNING evaluacion_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    res.json({ message: 'Evaluación eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando evaluación:', error);
    res.status(500).json({ message: 'No se pudo eliminar la evaluación' });
  }
});

export default router;