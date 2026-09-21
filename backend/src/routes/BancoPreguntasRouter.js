import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

function validateBancoPreguntas({ pregunta, opciones, respuesta_correcta, categoria, nivel }) {
  if (!pregunta || typeof pregunta !== 'string' || pregunta.trim() === '' || pregunta.length > 255) {
    return 'La pregunta es obligatoria y debe tener un maximo de 255 caracteres';
  }

  if (opciones !== undefined && opciones !== null && typeof opciones !== 'object') {
    return 'Las opciones deben ser un objeto o arreglo JSON valido';
  }

  if (!respuesta_correcta || typeof respuesta_correcta !== 'string' || respuesta_correcta.trim() === '' || respuesta_correcta.length > 255) {
    return 'La respuesta correcta es obligatoria y debe tener un maximo de 255 caracteres';
  }

  if (!categoria || typeof categoria !== 'string' || categoria.trim() === '' || categoria.length > 100) {
    return 'La categoria es obligatoria y debe tener un maximo de 100 caracteres';
  }

  // Ajusta los valores permitidos según tu enum `nivel_pregunta_enum` en la base de datos si es necesario
  const nivelesValidos = ['Facil', 'Medio', 'Dificil']; 
  if (nivel !== undefined && nivel !== null && !nivelesValidos.includes(nivel)) {
    return `El nivel debe ser uno de los siguientes: ${nivelesValidos.join(', ')}`;
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT pregunta_id, pregunta, opciones, respuesta_correcta, categoria, nivel 
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
    return res.status(400).json({ message: 'El ID de la pregunta no es valido' });
  }

  try {
    const result = await pool.query(
      `SELECT pregunta_id, pregunta, opciones, respuesta_correcta, categoria, nivel 
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
  const { pregunta, opciones, respuesta_correcta, categoria, nivel } = req.body;

  const validationError = validateBancoPreguntas({ pregunta, opciones, respuesta_correcta, categoria, nivel });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO BancoPreguntas (pregunta, opciones, respuesta_correcta, categoria, nivel)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING pregunta_id, pregunta, opciones, respuesta_correcta, categoria, nivel`,
      [
        pregunta.trim(),
        opciones !== undefined ? JSON.stringify(opciones) : null,
        respuesta_correcta.trim(),
        categoria.trim(),
        nivel || null
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
    return res.status(400).json({ message: 'El ID de la pregunta no es valido' });
  }

  const { pregunta, opciones, respuesta_correcta, categoria, nivel } = req.body;

  const validationError = validateBancoPreguntas({ pregunta, opciones, respuesta_correcta, categoria, nivel });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE BancoPreguntas
       SET pregunta = $1, opciones = $2, respuesta_correcta = $3, categoria = $4, nivel = $5
       WHERE pregunta_id = $6
       RETURNING pregunta_id, pregunta, opciones, respuesta_correcta, categoria, nivel`,
      [
        pregunta.trim(),
        opciones !== undefined ? JSON.stringify(opciones) : null,
        respuesta_correcta.trim(),
        categoria.trim(),
        nivel || null,
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
    return res.status(400).json({ message: 'El ID de la pregunta no es valido' });
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