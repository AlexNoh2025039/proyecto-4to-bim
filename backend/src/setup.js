import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function main() {
  const dbName = 'TalentBridge';
  const baseUrl = process.env.DATABASE_URL.substring(0, process.env.DATABASE_URL.lastIndexOf('/'));
  
  const admin = new Client({ connectionString: `${baseUrl}/postgres` });
  await admin.connect();
  
  const database = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );

  if (database.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${dbName}`);
    console.log(`Base de datos '${dbName}' creada.`);
  }

  await admin.end();

  const db = new Client({ connectionString: `${baseUrl}/${dbName}` });
  await db.connect();
  const schemaQuery = `
    -- Crear Tipos ENUM
    DO $$ BEGIN
      CREATE TYPE rol_usuario AS ENUM ('Administrador', 'Empresa', 'Candidato');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE tipo_jornada_enum AS ENUM ('Tiempo Completo', 'Medio Tiempo', 'Freelance', 'Temporal');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE estado_postulacion_enum AS ENUM ('Pendiente', 'En Revision', 'Aceptado', 'Rechazado');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE nivel_pregunta_enum AS ENUM ('Basico', 'Intermedio', 'Avanzado');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- 1. TABLA USUARIO
    CREATE TABLE IF NOT EXISTS Usuario(
      usuario_id SERIAL PRIMARY KEY,
      usuario_nombre VARCHAR(50) NOT NULL,
      usuario_apellido VARCHAR(50) NOT NULL,
      usuario_correo VARCHAR(100) NOT NULL UNIQUE,
      usuario_contrasena VARCHAR(255) NOT NULL,
      usuario_perfil BYTEA,
      usuario_telefono VARCHAR(20),
      usuario_dpi VARCHAR(20) UNIQUE,
      usuario_profesion VARCHAR(100),
      usuario_rol rol_usuario NOT NULL,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado BOOLEAN DEFAULT TRUE
    );

    -- 2. TABLA EMPRESA
    CREATE TABLE IF NOT EXISTS Empresa(
      empresa_id SERIAL PRIMARY KEY,
      empresa_nombre VARCHAR(100) NOT NULL,
      empresa_descripcion TEXT,
      empresa_correo VARCHAR(100) NOT NULL UNIQUE,
      empresa_logo BYTEA,
      empresa_telefono VARCHAR(20),
      empresa_nit VARCHAR(30) UNIQUE,
      empresa_direccion VARCHAR(250),
      usuario_admin INT NOT NULL REFERENCES Usuario(usuario_id) ON DELETE CASCADE
    );

    -- 3. TABLA CURRICULUM
    CREATE TABLE IF NOT EXISTS Curriculum(
      curriculum_id SERIAL PRIMARY KEY,
      curriculum_nombre VARCHAR(100),
      categoria_interes VARCHAR(100),
      habilidades TEXT,
      experiencia TEXT,
      formacion TEXT,
      curriculum_archivo BYTEA,
      fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      usuario_id INT REFERENCES Usuario(usuario_id) ON DELETE CASCADE
    );

    -- 4. TABLA VACANTE
    CREATE TABLE IF NOT EXISTS Vacante(
      vacante_id SERIAL PRIMARY KEY,
      vacante_nombre VARCHAR(100) NOT NULL,
      vacante_descripcion TEXT,
      habilidades_requeridas TEXT,
      categoria VARCHAR(100),
      salario DECIMAL(10,2),
      ubicacion VARCHAR(100),
      tipo_jornada tipo_jornada_enum,
      fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado BOOLEAN DEFAULT TRUE,
      empresa_id INT REFERENCES Empresa(empresa_id) ON DELETE CASCADE
    );

    -- 5. TABLA POSTULACION
    CREATE TABLE IF NOT EXISTS Postulacion(
      postulacion_id SERIAL PRIMARY KEY,
      usuario_id INT REFERENCES Usuario(usuario_id) ON DELETE CASCADE,
      vacante_id INT REFERENCES Vacante(vacante_id) ON DELETE CASCADE,
      porcentaje_compatibilidad INT DEFAULT 0,
      fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado estado_postulacion_enum DEFAULT 'Pendiente'
    );

    -- 6. TABLA HISTORIAL
    CREATE TABLE IF NOT EXISTS Historial(
      historial_id SERIAL PRIMARY KEY,
      descripcion VARCHAR(255),
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      postulacion_id INT REFERENCES Postulacion(postulacion_id) ON DELETE CASCADE
    );

    -- 7. TABLA BANCO DE PREGUNTAS
    CREATE TABLE IF NOT EXISTS BancoPreguntas(
      pregunta_id SERIAL PRIMARY KEY,
      pregunta VARCHAR(255),
      opciones JSONB,
      respuesta_correcta VARCHAR(255),
      categoria VARCHAR(100),
      nivel nivel_pregunta_enum
    );

    -- 8. TABLA EVALUACION
    CREATE TABLE IF NOT EXISTS Evaluacion(
      evaluacion_id SERIAL PRIMARY KEY,
      evaluacion_nombre VARCHAR(100),
      categoria VARCHAR(100),
      empresa_id INT REFERENCES Empresa(empresa_id) ON DELETE CASCADE,
      pregunta_id INT REFERENCES BancoPreguntas(pregunta_id) ON DELETE CASCADE
    );

    -- 9. TABLA RESPUESTA EVALUACION
    CREATE TABLE IF NOT EXISTS RespuestaEvaluacion(
      respuesta_id SERIAL PRIMARY KEY,
      usuario_id INT REFERENCES Usuario(usuario_id) ON DELETE CASCADE,
      evaluacion_id INT REFERENCES Evaluacion(evaluacion_id) ON DELETE CASCADE,
      nota_final DECIMAL(10,2) DEFAULT 0.00,
      fecha_realizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. TABLA NOTIFICACION
    CREATE TABLE IF NOT EXISTS Notificacion(
      notificacion_id SERIAL PRIMARY KEY,
      titulo VARCHAR(100),
      descripcion TEXT,
      tipo VARCHAR(50),
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado BOOLEAN DEFAULT FALSE,
      usuario_id INT REFERENCES Usuario(usuario_id) ON DELETE CASCADE
    );
  `;

  await db.query(schemaQuery);
  await db.end();
  
  console.log('Las 10 tablas de TalentBridge han sido creadas y enlazadas correctamente.');
}

main().catch((error) => {
  console.error('Error en setup:', error.message);
  process.exit(1);
});