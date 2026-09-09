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
    const [rows] = await pool.query('SELECT * FROM Vacante ORDER BY vacante_id ASC');
    res.json({ vacantes: rows });
  } catch (error) {
    console.error('Error al obtener la lista de vacantes:', error);
    res.status(500).json({ message: 'No fue posible consultar las vacantes' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM Vacante WHERE vacante_id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró la vacante solicitada' });
    }

    res.json({ vacante: rows[0] });
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
    const [result] = await pool.query(
      `INSERT INTO Vacante (vacante_nombre, vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, empresa_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vacante_nombre.trim(), vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, empresa_id]
    );

    const [newVacante] = await pool.query('SELECT * FROM Vacante WHERE vacante_id = ?', [result.insertId]);
    res.status(201).json({ vacante: newVacante[0] });
  } catch (error) {
    console.error('Error al registrar la vacante:', error);
    res.status(500).json({ message: 'No se pudo crear la vacante' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { vacante_nombre, vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, estado, empresa_id } = req.body;

  const validationError = validateVacante({ vacante_nombre, salario, tipo_jornada, empresa_id });
  if (validationError !== null) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const [result] = await pool.query(
      `UPDATE Vacante 
       SET vacante_nombre = ?, vacante_descripcion = ?, categoria = ?, salario = ?, ubicacion = ?, tipo_jornada = ?, estado = ?
       WHERE vacante_id = ?`,
      [vacante_nombre.trim(), vacante_descripcion, categoria, salario, ubicacion, tipo_jornada, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró la vacante para actualizar' });
    }

    const [updated] = await pool.query('SELECT * FROM Vacante WHERE vacante_id = ?', [id]);
    res.json({ vacante: updated[0] });
  } catch (error) {
    console.error('Error al actualizar la vacante:', error);
    res.status(500).json({ message: 'No se pudo guardar la actualización de la vacante' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Vacante WHERE vacante_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró la vacante a eliminar' });
    }

    res.json({ message: 'La vacante se eliminó con éxito' });
  } catch (error) {
    console.error('Error al eliminar la vacante:', error);
    res.status(500).json({ message: 'No se pudo borrar la vacante' });
  }
});

export default router;