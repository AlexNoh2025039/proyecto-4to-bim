import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('Administrador', 'Empresa'))

function validateBancoPreguntas({ pregunta, opciones, respuesta_correcta, categoria }) {
  if (!pregunta || typeof pregunta !== 'string' || pregunta.trim() === '' || pregunta.length > 255) {
    return 'La pregunta es obligatoria y debe tener un máximo de 255 caracteres';
  }

  if (opciones !== undefined && opciones !== null && (typeof opciones !== 'object' || Array.isArray(opciones) === false)) {
    return 'Las opciones deben ser una estructura válida de arreglo o formato JSON';
  }

  if (!respuesta_correcta || typeof respuesta_correcta !== 'string' || respuesta_correcta.trim() === '' || respuesta_correcta.length > 255) {
    return 'La respuesta correcta es obligatoria y debe tener un máximo de 255 caracteres';
  }

  if (!categoria || typeof categoria !== 'string' || categoria.trim() === '' || categoria.length > 100) {
    return 'La categoría es obligatoria y debe tener un máximo de 100 caracteres';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT pregunta_id, pregunta, opciones, respuesta_correcta, categoria 
       FROM BancoPreguntas 
       ORDER BY pregunta_id ASC`
    );

    res.json({ preguntas: result.rows });
  } catch (error) {
    console.error('Error listando preguntas:', error);
    res.status(500).json({ message: 'No se pudieron consultar las preguntas' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la pregunta no es válido' });
  }

  try {
    const result = await pool.query(
      `SELECT pregunta_id, pregunta, opciones, respuesta_correcta, categoria 
       FROM BancoPreguntas 
       WHERE pregunta_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }

    res.json({ pregunta: result.rows[0] });
  } catch (error) {
    console.error('Error consultando pregunta:', error);
    res.status(500).json({ message: 'No se pudo consultar la pregunta' });
  }
});

router.post('/', async (req, res) => {
  const { pregunta, opciones, respuesta_correcta, categoria } = req.body;

  const validationError = validateBancoPreguntas({ pregunta, opciones, respuesta_correcta, categoria });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO BancoPreguntas (pregunta, opciones, respuesta_correcta, categoria)
       VALUES ($1, $2, $3, $4)
       RETURNING pregunta_id, pregunta, opciones, respuesta_correcta, categoria`,
      [
        pregunta.trim(),
        opciones ? JSON.stringify(opciones) : null,
        respuesta_correcta.trim(),
        categoria.trim()
      ]
    );

    res.status(201).json({ pregunta: result.rows[0] });
  } catch (error) {
    console.error('Error creando pregunta:', error);
    res.status(500).json({ message: 'No se pudo crear la pregunta' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la pregunta no es válido' });
  }

  const { pregunta, opciones, respuesta_correcta, categoria } = req.body;

  const validationError = validateBancoPreguntas({ pregunta, opciones, respuesta_correcta, categoria });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE BancoPreguntas
       SET pregunta = $1, opciones = $2, respuesta_correcta = $3, categoria = $4
       WHERE pregunta_id = $5
       RETURNING pregunta_id, pregunta, opciones, respuesta_correcta, categoria`,
      [
        pregunta.trim(),
        opciones ? JSON.stringify(opciones) : null,
        respuesta_correcta.trim(),
        categoria.trim(),
        id
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }

    res.json({ pregunta: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando pregunta:', error);
    res.status(500).json({ message: 'No se pudo actualizar la pregunta' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la pregunta no es válido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM BancoPreguntas WHERE pregunta_id = $1 RETURNING pregunta_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }

    res.json({ message: 'Pregunta eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando pregunta:', error);
    res.status(500).json({ message: 'No se pudo eliminar la pregunta' });
  }
});

export default router;