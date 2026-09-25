import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

function validateRespuestaInput({ usuario_id, evaluacion_id, pregunta_id, respuesta_usuario }) {
  const uId = Number(usuario_id);
  const eId = Number(evaluacion_id);
  const pId = Number(pregunta_id);

  if (!Number.isInteger(uId) || uId <= 0) return 'El usuario_id debe ser un entero válido';
  if (!Number.isInteger(eId) || eId <= 0) return 'El evaluacion_id debe ser un entero válido';
  if (!Number.isInteger(pId) || pId <= 0) return 'El pregunta_id debe ser un entero válido';

  if (!respuesta_usuario || typeof respuesta_usuario !== 'string' || respuesta_usuario.trim() === '' || respuesta_usuario.length > 255) {
    return 'La respuesta_usuario es obligatoria y debe tener un máximo de 255 caracteres';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         r.respuesta_id, 
         r.usuario_id, 
         u.usuario_nombre, 
         u.usuario_apellido,
         r.evaluacion_id, 
         e.evaluacion_nombre,
         r.pregunta_id, 
         bp.pregunta,
         r.respuesta_usuario, 
         r.nota_final, 
         r.fecha_realizacion
       FROM RespuestaEvaluacion r
       JOIN Usuario u ON r.usuario_id = u.usuario_id
       JOIN Evaluacion e ON r.evaluacion_id = e.evaluacion_id
       JOIN BancoPreguntas bp ON r.pregunta_id = bp.pregunta_id
       ORDER BY r.respuesta_id ASC`
    );

    res.json({ respuestas: result.rows });
  } catch (error) {
    console.error('Error listando respuestas:', error);
    res.status(500).json({ message: 'No se pudieron consultar las respuestas' });
  }
});

router.get('/ranking', async (req, res) => {
  try {
    let query = `
      SELECT
        r.usuario_id,
        u.usuario_nombre,
        u.usuario_apellido,
        u.usuario_correo,
        u.usuario_telefono,
        r.evaluacion_id,
        e.evaluacion_nombre,
        e.empresa_id,
        ROUND(AVG(r.nota_final), 2) AS promedio,
        COUNT(*) AS total_preguntas,
        MAX(r.fecha_realizacion) AS fecha_realizacion
      FROM RespuestaEvaluacion r
      JOIN Usuario u ON u.usuario_id = r.usuario_id
      JOIN Evaluacion e ON e.evaluacion_id = r.evaluacion_id
    `;

    const params = [];

    if (req.user.usuario_rol === 'Empresa') {
      query += ` WHERE e.empresa_id = (SELECT empresa_id FROM Empresa WHERE usuario_admin = $1) `;
      params.push(req.user.usuario_id);
    }

    query += `
      GROUP BY r.usuario_id, u.usuario_nombre, u.usuario_apellido, u.usuario_correo, u.usuario_telefono,
               r.evaluacion_id, e.evaluacion_nombre, e.empresa_id
      ORDER BY promedio DESC
    `;

    const result = await pool.query(query, params);
    res.json({ ranking: result.rows });
  } catch (error) {
    console.error('Error generando ranking:', error);
    res.status(500).json({ message: 'No se pudo generar el ranking' });
  }
});


router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la respuesta no es válido' });
  }

  try {
    const result = await pool.query(
      `SELECT 
         r.respuesta_id, 
         r.usuario_id, 
         u.usuario_nombre, 
         r.evaluacion_id, 
         e.evaluacion_nombre,
         r.pregunta_id, 
         bp.pregunta,
         r.respuesta_usuario, 
         r.nota_final, 
         r.fecha_realizacion
       FROM RespuestaEvaluacion r
       JOIN Usuario u ON r.usuario_id = u.usuario_id
       JOIN Evaluacion e ON r.evaluacion_id = e.evaluacion_id
       JOIN BancoPreguntas bp ON r.pregunta_id = bp.pregunta_id
       WHERE r.respuesta_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Respuesta no encontrada' });
    }

    res.json({ respuesta: result.rows[0] });
  } catch (error) {
    console.error('Error consultando respuesta:', error);
    res.status(500).json({ message: 'No se pudo consultar la respuesta' });
  }
});

router.post('/', async (req, res) => {
  const { usuario_id, evaluacion_id, pregunta_id, respuesta_usuario } = req.body;

  const validationError = validateRespuestaInput({ usuario_id, evaluacion_id, pregunta_id, respuesta_usuario });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    // 1. Validar FK de Usuario
    const usuarioRes = await pool.query('SELECT usuario_id FROM Usuario WHERE usuario_id = $1', [usuario_id]);
    if (!usuarioRes.rows[0]) {
      return res.status(400).json({ message: 'El usuario especificado no existe' });
    }

    // 2. Validar FK de Evaluacion
    const evaluacionRes = await pool.query('SELECT evaluacion_id FROM Evaluacion WHERE evaluacion_id = $1', [evaluacion_id]);
    if (!evaluacionRes.rows[0]) {
      return res.status(400).json({ message: 'La evaluación especificada no existe' });
    }

    // 3. Validar FK de BancoPreguntas y obtener la respuesta correcta
    const preguntaRes = await pool.query('SELECT respuesta_correcta FROM BancoPreguntas WHERE pregunta_id = $1', [pregunta_id]);
    if (!preguntaRes.rows[0]) {
      return res.status(400).json({ message: 'La pregunta especificada no existe' });
    }

    const { respuesta_correcta } = preguntaRes.rows[0];
    const esCorrecta = respuesta_usuario.trim().toLowerCase() === respuesta_correcta.trim().toLowerCase();
    const nota_final = esCorrecta ? 100.00 : 0.00;
    const result = await pool.query(
      `INSERT INTO RespuestaEvaluacion (usuario_id, evaluacion_id, pregunta_id, respuesta_usuario, nota_final)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING respuesta_id, usuario_id, evaluacion_id, pregunta_id, respuesta_usuario, nota_final, fecha_realizacion`,
      [usuario_id, evaluacion_id, pregunta_id, respuesta_usuario.trim(), nota_final]
    );

    res.status(201).json({
      message: esCorrecta ? 'Respuesta correcta' : 'Respuesta incorrecta',
      respuesta: result.rows[0]
    });
  } catch (error) {
    console.error('Error guardando respuesta:', error);
    res.status(500).json({ message: 'No se pudo registrar la respuesta' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la respuesta no es válido' });
  }

  const { usuario_id, evaluacion_id, pregunta_id, respuesta_usuario } = req.body;

  const validationError = validateRespuestaInput({ usuario_id, evaluacion_id, pregunta_id, respuesta_usuario });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const usuarioRes = await pool.query('SELECT usuario_id FROM Usuario WHERE usuario_id = $1', [usuario_id]);
    if (!usuarioRes.rows[0]) return res.status(400).json({ message: 'El usuario especificado no existe' });

    const evaluacionRes = await pool.query('SELECT evaluacion_id FROM Evaluacion WHERE evaluacion_id = $1', [evaluacion_id]);
    if (!evaluacionRes.rows[0]) return res.status(400).json({ message: 'La evaluación especificada no existe' });

    const preguntaRes = await pool.query('SELECT respuesta_correcta FROM BancoPreguntas WHERE pregunta_id = $1', [pregunta_id]);
    if (!preguntaRes.rows[0]) return res.status(400).json({ message: 'La pregunta especificada no existe' });

    const { respuesta_correcta } = preguntaRes.rows[0];
    const esCorrecta = respuesta_usuario.trim().toLowerCase() === respuesta_correcta.trim().toLowerCase();
    const nota_final = esCorrecta ? 100.00 : 0.00;

    const result = await pool.query(
      `UPDATE RespuestaEvaluacion
       SET usuario_id = $1, evaluacion_id = $2, pregunta_id = $3, respuesta_usuario = $4, nota_final = $5
       WHERE respuesta_id = $6
       RETURNING respuesta_id, usuario_id, evaluacion_id, pregunta_id, respuesta_usuario, nota_final, fecha_realizacion`,
      [usuario_id, evaluacion_id, pregunta_id, respuesta_usuario.trim(), nota_final, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Respuesta no encontrada' });
    }

    res.json({ respuesta: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando respuesta:', error);
    res.status(500).json({ message: 'No se pudo actualizar la respuesta' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la respuesta no es válido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM RespuestaEvaluacion WHERE respuesta_id = $1 RETURNING respuesta_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Respuesta no encontrada' });
    }

    res.json({ message: 'Respuesta eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando respuesta:', error);
    res.status(500).json({ message: 'No se pudo eliminar la respuesta' });
  }
});

export default router;