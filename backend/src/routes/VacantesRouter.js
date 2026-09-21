import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

function validateVacante({ vacante_nombre, salario, tipo_jornada, empresa_id }) {
  if (typeof vacante_nombre !== 'string' || vacante_nombre.trim().length === 0) {
    return 'El nombre de la vacante es obligatorio';
  }

  if (vacante_nombre.trim().length > 100) {
    return 'El nombre no puede superar los 100 caracteres';
  }

  if (salario !== undefined && salario !== null) {
    const numSalario = Number(salario);
    if (Number.isNaN(numSalario) || numSalario < 0) {
      return 'El salario debe ser un número válido igual o mayor a 0';
    }
  }

  const jornadasValidas = ['Tiempo Completo', 'Medio Tiempo', 'Freelance', 'Temporal'];
  if (tipo_jornada && !jornadasValidas.includes(tipo_jornada)) {
    return 'El tipo de jornada ingresado no es válido';
  }

  if (!Number.isInteger(Number(empresa_id)) || Number(empresa_id) <= 0) {
    return 'Debes proporcionar un ID de empresa válido';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Vacante ORDER BY vacante_id ASC');
    res.json({ vacantes: result.rows });
  } catch (error) {
    console.error('Error al obtener la lista de vacantes:', error);
    res.status(500).json({ message: 'No fue posible consultar las vacantes' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la vacante no es válido' });
  }

  try {
    const result = await pool.query('SELECT * FROM Vacante WHERE vacante_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró la vacante solicitada' });
    }

    res.json({ vacante: result.rows[0] });
  } catch (error) {
    console.error('Error al consultar la vacante:', error);
    res.status(500).json({ message: 'Ocurrió un error al buscar la vacante' });
  }
});

router.post('/', async (req, res) => {
  const { vacante_nombre, vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, empresa_id } = req.body;
  const validationError = validateVacante({ vacante_nombre, salario, tipo_jornada, empresa_id });

  if (validationError !== null) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Vacante (vacante_nombre, vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, empresa_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [vacante_nombre.trim(), vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, empresa_id]
    );

    res.status(201).json({ vacante: result.rows[0] });
  } catch (error) {
    console.error('Error al registrar la vacante:', error);
    if (error.code === '23503') {
      return res.status(400).json({ message: 'La empresa especificada no existe' });
    }
    res.status(500).json({ message: 'No se pudo crear la vacante' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la vacante no es válido' });
  }

  const { vacante_nombre, vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, estado, empresa_id } = req.body;

  const validationError = validateVacante({ vacante_nombre, salario, tipo_jornada, empresa_id });
  if (validationError !== null) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE Vacante 
       SET vacante_nombre = $1, vacante_descripcion = $2, categoria = $3, salario = $4, ubicacion = $5, tipo_jornada = $6, estado = $7
       WHERE vacante_id = $8
       RETURNING *`,
      [vacante_nombre.trim(), vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, estado ?? true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró la vacante para actualizar' });
    }

    res.json({ vacante: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar la vacante:', error);
    res.status(500).json({ message: 'No se pudo guardar la actualización de la vacante' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la vacante no es válido' });
  }

  try {
    const result = await pool.query('DELETE FROM Vacante WHERE vacante_id = $1 RETURNING vacante_id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró la vacante a eliminar' });
    }

    res.json({ message: 'La vacante se eliminó con éxito' });
  } catch (error) {
    console.error('Error al eliminar la vacante:', error);
    res.status(500).json({ message: 'No se pudo borrar la vacante' });
  }
});

export default router;