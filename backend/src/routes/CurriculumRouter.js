import { Router } from 'express';
import { pool } from '../db.js';
import {
  requireAuth,
  requireRole
} from '../middlewares/auth.js';

const router = Router();
const MAX_CURRICULUM_BYTES = 10 * 1024 * 1024;

router.use(requireAuth);

function normalizarOpcional(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const valor = value.trim();
  return valor === '' ? null : valor;
}

function validateCurriculumBase({
  curriculum_nombre,
  categoria_interes,
  habilidades,
  experiencia,
  formacion
}) {
  if (
    typeof curriculum_nombre !== 'string' ||
    !curriculum_nombre.trim()
  ) {
    return 'El nombre del curriculum es obligatorio';
  }

  if (curriculum_nombre.trim().length > 100) {
    return 'El nombre del curriculum no puede superar los 100 caracteres';
  }

  if (
    typeof categoria_interes !== 'string' ||
    !categoria_interes.trim()
  ) {
    return 'La categoría de interés es obligatoria';
  }

  if (categoria_interes.trim().length > 100) {
    return 'La categoría de interés no puede superar los 100 caracteres';
  }

  if (
    habilidades !== null &&
    habilidades !== undefined &&
    typeof habilidades !== 'string'
  ) {
    return 'Las habilidades deben ser texto';
  }

  if (
    experiencia !== null &&
    experiencia !== undefined &&
    typeof experiencia !== 'string'
  ) {
    return 'La experiencia debe ser texto';
  }

  if (
    formacion !== null &&
    formacion !== undefined &&
    typeof formacion !== 'string'
  ) {
    return 'La formación debe ser texto';
  }

  return null;
}

function convertirArchivoPDF(valor) {
  if (valor === undefined) {
    return undefined;
  }

  if (valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new Error(
      'El archivo del curriculum debe enviarse como texto'
    );
  }

  const match = valor.match(
    /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    throw new Error(
      'El archivo debe ser un PDF válido en formato base64'
    );
  }

  const buffer = Buffer.from(match[1], 'base64');

  if (buffer.length === 0) {
    throw new Error('El archivo enviado está vacío');
  }

  if (buffer.length > MAX_CURRICULUM_BYTES) {
    throw new Error(
      'El curriculum no puede superar los 10 MB'
    );
  }

  const cabecera = buffer.toString('ascii', 0, 5);

  if (cabecera !== '%PDF-') {
    throw new Error(
      'El archivo enviado no parece ser un PDF válido'
    );
  }

  return buffer;
}

function bufferAPdfDataUri(buffer) {
  if (!buffer) {
    return null;
  }

  return `data:application/pdf;base64,${buffer.toString('base64')}`;
}

router.get(
  '/me',
  requireRole('Candidato'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          curriculum_id,
          curriculum_nombre,
          categoria_interes,
          habilidades,
          experiencia,
          formacion,
          fecha_subida,
          usuario_id,
          CASE
            WHEN curriculum_archivo IS NULL
            THEN false
            ELSE true
          END AS tiene_archivo
        FROM Curriculum
        WHERE usuario_id = $1
        ORDER BY curriculum_id ASC
        `,
        [req.user.usuario_id]
      );

      return res.json({
        curriculums: result.rows
      });
    } catch (error) {
      console.error(
        'Error listando mis curriculums:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudieron consultar tus curriculums'
      });
    }
  }
);

router.post(
  '/',
  requireRole('Candidato'),
  async (req, res) => {
    const {
      curriculum_nombre,
      categoria_interes,
      habilidades,
      experiencia,
      formacion,
      curriculum_archivo
    } = req.body;

    const datos = {
      curriculum_nombre:
        normalizarOpcional(curriculum_nombre),
      categoria_interes:
        normalizarOpcional(categoria_interes),
      habilidades:
        normalizarOpcional(habilidades),
      experiencia:
        normalizarOpcional(experiencia),
      formacion:
        normalizarOpcional(formacion)
    };

    const validationError =
      validateCurriculumBase(datos);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    let archivo;

    try {
      archivo =
        convertirArchivoPDF(
          curriculum_archivo
        );
    } catch (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    try {
      const result = await pool.query(
        `
        INSERT INTO Curriculum (
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
          fecha_subida,
          usuario_id
        `,
        [
          datos.curriculum_nombre,
          datos.categoria_interes,
          datos.habilidades,
          datos.experiencia,
          datos.formacion,
          archivo,
          req.user.usuario_id
        ]
      );

      return res.status(201).json({
        message:
          'Curriculum creado correctamente',
        curriculum:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        'Error creando curriculum:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo crear el curriculum'
      });
    }
  }
);

router.get(
  '/:id',
  requireRole('Administrador', 'Candidato'),
  async (req, res) => {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          'El ID del curriculum no es válido'
      });
    }

    try {
      let result;

      if (
        req.user.usuario_rol ===
        'Administrador'
      ) {
        result = await pool.query(
          `
          SELECT
            c.curriculum_id,
            c.curriculum_nombre,
            c.categoria_interes,
            c.habilidades,
            c.experiencia,
            c.formacion,
            c.curriculum_archivo,
            c.fecha_subida,
            c.usuario_id,
            u.usuario_nombre,
            u.usuario_apellido
          FROM Curriculum c
          INNER JOIN Usuario u
            ON u.usuario_id = c.usuario_id
          WHERE c.curriculum_id = $1
          `,
          [id]
        );
      } else {
        result = await pool.query(
          `
          SELECT
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
          WHERE
            curriculum_id = $1
            AND usuario_id = $2
          `,
          [
            id,
            req.user.usuario_id
          ]
        );
      }

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            'Curriculum no encontrado'
        });
      }

      const curriculum =
        result.rows[0];

      curriculum.curriculum_archivo =
        bufferAPdfDataUri(
          curriculum.curriculum_archivo
        );

      return res.json({
        curriculum
      });
    } catch (error) {
      console.error(
        'Error consultando curriculum:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo consultar el curriculum'
      });
    }
  }
);

router.put(
  '/:id',
  requireRole('Candidato'),
  async (req, res) => {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          'El ID del curriculum no es válido'
      });
    }

    const {
      curriculum_nombre,
      categoria_interes,
      habilidades,
      experiencia,
      formacion,
      curriculum_archivo
    } = req.body;

    const datos = {
      curriculum_nombre:
        normalizarOpcional(curriculum_nombre),
      categoria_interes:
        normalizarOpcional(categoria_interes),
      habilidades:
        normalizarOpcional(habilidades),
      experiencia:
        normalizarOpcional(experiencia),
      formacion:
        normalizarOpcional(formacion)
    };

    const validationError =
      validateCurriculumBase(datos);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    let archivo;

    try {
      archivo =
        convertirArchivoPDF(
          curriculum_archivo
        );
    } catch (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    try {
      let result;

      if (archivo === undefined) {
        result = await pool.query(
          `
          UPDATE Curriculum
          SET
            curriculum_nombre = $1,
            categoria_interes = $2,
            habilidades = $3,
            experiencia = $4,
            formacion = $5
          WHERE
            curriculum_id = $6
            AND usuario_id = $7
          RETURNING
            curriculum_id,
            curriculum_nombre,
            categoria_interes,
            habilidades,
            experiencia,
            formacion,
            fecha_subida,
            usuario_id
          `,
          [
            datos.curriculum_nombre,
            datos.categoria_interes,
            datos.habilidades,
            datos.experiencia,
            datos.formacion,
            id,
            req.user.usuario_id
          ]
        );
      } else {
        result = await pool.query(
          `
          UPDATE Curriculum
          SET
            curriculum_nombre = $1,
            categoria_interes = $2,
            habilidades = $3,
            experiencia = $4,
            formacion = $5,
            curriculum_archivo = $6
          WHERE
            curriculum_id = $7
            AND usuario_id = $8
          RETURNING
            curriculum_id,
            curriculum_nombre,
            categoria_interes,
            habilidades,
            experiencia,
            formacion,
            fecha_subida,
            usuario_id
          `,
          [
            datos.curriculum_nombre,
            datos.categoria_interes,
            datos.habilidades,
            datos.experiencia,
            datos.formacion,
            archivo,
            id,
            req.user.usuario_id
          ]
        );
      }

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            'Curriculum no encontrado o no pertenece al usuario'
        });
      }

      return res.json({
        message:
          'Curriculum actualizado correctamente',
        curriculum:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        'Error actualizando curriculum:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo actualizar el curriculum'
      });
    }
  }
);

router.delete(
  '/:id',
  requireRole('Candidato'),
  async (req, res) => {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          'El ID del curriculum no es válido'
      });
    }

    try {
      const result =
        await pool.query(
          `
          DELETE FROM Curriculum
          WHERE
            curriculum_id = $1
            AND usuario_id = $2
          RETURNING curriculum_id
          `,
          [
            id,
            req.user.usuario_id
          ]
        );

      if (!result.rows[0]) {
        return res.status(404).json({
          message:
            'Curriculum no encontrado o no pertenece al usuario'
        });
      }

      return res.json({
        message:
          'Curriculum eliminado correctamente'
      });
    } catch (error) {
      console.error(
        'Error eliminando curriculum:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo eliminar el curriculum'
      });
    }
  }
);

router.get(
  '/',
  requireRole('Administrador'),
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            c.curriculum_id,
            c.curriculum_nombre,
            c.categoria_interes,
            c.habilidades,
            c.experiencia,
            c.formacion,
            c.fecha_subida,
            c.usuario_id,
            u.usuario_nombre,
            u.usuario_apellido,
            CASE
              WHEN c.curriculum_archivo IS NULL
              THEN false
              ELSE true
            END AS tiene_archivo
          FROM Curriculum c
          INNER JOIN Usuario u
            ON u.usuario_id = c.usuario_id
          ORDER BY c.curriculum_id ASC
          `
        );

      return res.json({
        curriculums:
          result.rows
      });
    } catch (error) {
      console.error(
        'Error listando curriculums:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudieron consultar los curriculums'
      });
    }
  }
);

export default router;