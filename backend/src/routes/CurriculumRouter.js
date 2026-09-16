import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function validateCurriculum({
  curriculum_nombre,
  categoria_interes,
  habilidades,
  experiencia,
  formacion,
  usuario_id
}) {
  if (curriculum_nombre !== undefined && 
      (typeof curriculum_nombre !== 'string' || curriculum_nombre.trim().length === 0)) {
    return 'El nombre del curriculum es obligatorio';
  }

  if (curriculum_nombre !== undefined && curriculum_nombre.length > 100) {
    return 'El nombre del curriculum no puede superar los 100 caracteres';
  }

  if (categoria_interes !== undefined && 
      (typeof categoria_interes !== 'string' || categoria_interes.trim().length === 0)) {
    return 'La categoría de interés no puede estar vacía';
  }

  if (categoria_interes !== undefined && categoria_interes.length > 100) {
    return 'La categoría de interés no puede superar los 100 caracteres';
  }

  if (habilidades !== undefined && typeof habilidades !== 'string') {
    return 'Las habilidades deben ser texto';
  }

  if (experiencia !== undefined && typeof experiencia !== 'string') {
    return 'La experiencia debe ser texto';
  }

  if (formacion !== undefined && typeof formacion !== 'string') {
    return 'La formación debe ser texto';
  }

  if (!Number.isInteger(usuario_id) || usuario_id <= 0) {
    return 'El ID de usuario debe ser un entero positivo';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        curriculum_id,
        curriculum_nombre,
        categoria_interes,
        habilidades,
        experiencia,
        formacion,
        curriculum_archivo,
        fecha_subida,
        usuario_id
       FROM Curriculum
       ORDER BY curriculum_id ASC`
    );

    res.json({ curriculums: result.rows });
  } catch (error) {
    console.error('Error listando curriculums:', error);
    res.status(500).json({
      message: 'No se pudieron consultar los curriculums'
    });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El ID del curriculum no es válido'
    });
  }

  try {
    const result = await pool.query(
      `SELECT 
        curriculum_id,
        curriculum_nombre,
        categoria_interes,
        habilidades,
        experiencia,
        formacion,
        curriculum_archivo,
        fecha_subida,
        usuario_id
       FROM Curriculum
       WHERE curriculum_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Curriculum no encontrado'
      });
    }

    res.json({ curriculum: result.rows[0] });
  } catch (error) {
    console.error('Error consultando curriculum:', error);
    res.status(500).json({
      message: 'No se pudo consultar el curriculum'
    });
  }
});

router.post('/', async (req, res) => {
  const {
    curriculum_nombre,
    categoria_interes,
    habilidades,
    experiencia,
    formacion,
    curriculum_archivo,
    usuario_id
  } = req.body;

  const validationError = validateCurriculum({
    curriculum_nombre,
    categoria_interes,
    habilidades,
    experiencia,
    formacion,
    usuario_id
  });

  if (validationError) {
    return res.status(400).json({
      message: validationError
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Curriculum (
        curriculum_nombre,
        categoria_interes,
        habilidades,
        experiencia,
        formacion,
        curriculum_archivo,
        usuario_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        curriculum_id,
        curriculum_nombre,
        categoria_interes,
        habilidades,
        experiencia,
        formacion,
        curriculum_archivo,
        fecha_subida,
        usuario_id`,
      [
        curriculum_nombre,
        categoria_interes,
        habilidades,
        experiencia,
        formacion,
        curriculum_archivo,
        usuario_id
      ]
    );

    res.status(201).json({
      curriculum: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando curriculum:', error);
    res.status(500).json({
      message: 'No se pudo crear el curriculum'
    });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El ID del curriculum no es válido'
    });
  }

  const {
    curriculum_nombre,
    categoria_interes,
    habilidades,
    experiencia,
    formacion,
    curriculum_archivo,
    usuario_id
  } = req.body;

  const validationError = validateCurriculum({
    curriculum_nombre,
    categoria_interes,
    habilidades,
    experiencia,
    formacion,
    usuario_id
  });

  if (validationError) {
    return res.status(400).json({
      message: validationError
    });
  }

  try {
    const result = await pool.query(
      `UPDATE Curriculum
       SET 
         curriculum_nombre = $1,
         categoria_interes = $2,
         habilidades = $3,
         experiencia = $4,
         formacion = $5,
         curriculum_archivo = $6,
         usuario_id = $7
       WHERE curriculum_id = $8
       RETURNING 
         curriculum_id,
         curriculum_nombre,
         categoria_interes,
         habilidades,
         experiencia,
         formacion,
         curriculum_archivo,
         fecha_subida,
         usuario_id`,
      [
        curriculum_nombre,
        categoria_interes,
        habilidades,
        experiencia,
        formacion,
        curriculum_archivo,
        usuario_id,
        id
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Curriculum no encontrado'
      });
    }

    res.json({
      curriculum: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando curriculum:', error);
    res.status(500).json({
      message: 'No se pudo actualizar el curriculum'
    });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El ID del curriculum no es válido'
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM Curriculum
       WHERE curriculum_id = $1
       RETURNING curriculum_id`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Curriculum no encontrado'
      });
    }

    res.json({
      message: 'Curriculum eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando curriculum:', error);
    res.status(500).json({
      message: 'No se pudo eliminar el curriculum'
    });
  }
});

export default router;
