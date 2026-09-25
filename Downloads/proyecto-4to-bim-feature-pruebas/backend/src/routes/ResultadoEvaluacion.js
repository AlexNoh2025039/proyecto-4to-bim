import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// ==========================================
// ENDPOINT PARA OBTENER EL RANKING GENERAL
// ==========================================
router.get('/ranking/general', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         r.resultado_id,
         u.usuario_id,
         u.usuario_correo,
         e.evaluacion_id,
         e.evaluacion_nombre,
         r.puntaje,
         r.porcentaje,
         r.aprobado,
         r.fecha_realizacion
       FROM ResultadoEvaluacion r
       JOIN Usuario u ON r.usuario_id = u.usuario_id
       JOIN Evaluacion e ON r.evaluacion_id = e.evaluacion_id
       ORDER BY r.porcentaje DESC, r.puntaje DESC`
    );

    res.json({ ranking: result.rows });
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    res.status(500).json({ message: 'No se pudo consultar el ranking de calificaciones' });
  }
});

// ==========================================
// ENDPOINT PARA GUARDAR RESULTADOS (El que ya usabas)
// ==========================================
router.post('/', async (req, res) => {
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

export default router;  