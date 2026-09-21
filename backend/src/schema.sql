DROP DATABASE IF EXISTS talentbridge_in5bm;
CREATE DATABASE talentbridge_in5bm;
USE talentbridge_in5bm;
 
-- ==========================
-- TABLA USUARIO
-- ==========================
CREATE TABLE Usuario(
    usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_nombre VARCHAR(50) NOT NULL,
    usuario_apellido VARCHAR(50) NOT NULL,
    usuario_correo VARCHAR(100) NOT NULL UNIQUE,
<<<<<<< HEAD:backend/src/BD_TalentBrigde.sql
    usuario_contrasena VARCHAR(255) NOT NULL,
    usuario_perfil LONGBLOB,
=======
    usuario_password VARCHAR(255) NOT NULL,
    usuario_perfil BYTEA,
>>>>>>> 11f50d1 (Pruebas y actualizaciones):backend/src/schema.sql
    usuario_telefono VARCHAR(20),
    usuario_dpi VARCHAR(20) UNIQUE,
    usuario_profesion VARCHAR(100),
    usuario_rol ENUM('Administrador','Empresa','Candidato') NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT TRUE
);
 
-- ==========================
-- TABLA EMPRESA
-- ==========================
CREATE TABLE Empresa(
    empresa_id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_nombre VARCHAR(100) NOT NULL,
    empresa_descripcion TEXT,
    empresa_correo VARCHAR(100) NOT NULL UNIQUE,
    empresa_logo LONGBLOB,
    empresa_telefono VARCHAR(20),
    empresa_nit VARCHAR(30) UNIQUE,
    empresa_direccion VARCHAR(250),
    usuario_admin INT NOT NULL,
    FOREIGN KEY(usuario_admin)
        REFERENCES Usuario(usuario_id)
        ON DELETE CASCADE
);
 
-- ==========================
-- TABLA CURRICULUM
-- ==========================
CREATE TABLE Curriculum(
    curriculum_id INT PRIMARY KEY AUTO_INCREMENT,
    curriculum_nombre VARCHAR(100),
    categoria_interes VARCHAR(100),
    habilidades TEXT,
    experiencia TEXT,
    formacion TEXT,
    curriculum_archivo LONGBLOB,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    FOREIGN KEY(usuario_id)
        REFERENCES Usuario(usuario_id)
        ON DELETE CASCADE
);
 
-- ==========================
-- TABLA VACANTE
-- ==========================
CREATE TABLE Vacante(
    vacante_id INT PRIMARY KEY AUTO_INCREMENT,
    vacante_nombre VARCHAR(100) NOT NULL,
    vacante_descripcion TEXT,
    habilidades_requeridas TEXT,
    categoria VARCHAR(100),
    salario DECIMAL(10,2),
    ubicacion VARCHAR(100),
    tipo_jornada ENUM('Tiempo Completo','Medio Tiempo','Freelance','Temporal'),
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT TRUE,
    empresa_id INT,
    FOREIGN KEY(empresa_id)
        REFERENCES Empresa(empresa_id)
        ON DELETE CASCADE
);
 
-- ==========================
-- TABLA POSTULACION
-- ==========================
CREATE TABLE Postulacion(
    postulacion_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    vacante_id INT,
    porcentaje_compatibilidad INT DEFAULT 0,
    fecha_postulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Pendiente','En Revision','Aceptado','Rechazado')
        DEFAULT 'Pendiente',
    FOREIGN KEY(usuario_id)
        REFERENCES Usuario(usuario_id)
        ON DELETE CASCADE,
    FOREIGN KEY(vacante_id)
        REFERENCES Vacante(vacante_id)
        ON DELETE CASCADE
);
 
-- ==========================
-- TABLA HISTORIAL
-- ==========================
CREATE TABLE Historial(
    historial_id INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(255),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    postulacion_id INT,
    FOREIGN KEY(postulacion_id)
        REFERENCES Postulacion(postulacion_id)
        ON DELETE CASCADE
);
 
-- ==========================
-- TABLA BANCO DE PREGUNTAS
-- ==========================
CREATE TABLE BancoPreguntas(
    pregunta_id INT PRIMARY KEY AUTO_INCREMENT,
    pregunta VARCHAR(255),
    opciones JSON,
    categoria VARCHAR(255),
    respuesta_correcta VARCHAR(255),
    categoria VARCHAR(100),
    nivel ENUM('Basico','Intermedio','Avanzado')
);
 
-- ==========================
-- TABLA EVALUACION
-- ==========================
CREATE TABLE Evaluacion(
    evaluacion_id INT PRIMARY KEY AUTO_INCREMENT,
    evaluacion_nombre VARCHAR(100),
    categoria VARCHAR(100),
    empresa_id INT,
    pregunta_id INT,
    FOREIGN KEY(empresa_id)
        REFERENCES Empresa(empresa_id)
        ON DELETE CASCADE,
    FOREIGN KEY(pregunta_id)
    REFERENCES BancoPreguntas(pregunta_id)
    ON DELETE CASCADE
);
 
-- ==========================
-- TABLA RESPUESTA EVALUACION
-- ==========================
CREATE TABLE RespuestaEvaluacion(
    respuesta_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    evaluacion_id INT,
    nota_final DECIMAL(10,2) DEFAULT 0.00,
    fecha_realizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id)
        REFERENCES Usuario(usuario_id)
        ON DELETE CASCADE,
    FOREIGN KEY(evaluacion_id)
        REFERENCES Evaluacion(evaluacion_id)
        ON DELETE CASCADE
);
 
-- ==========================
-- TABLA NOTIFICACION
-- ==========================
CREATE TABLE Notificacion(
    notificacion_id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(100),
    descripcion TEXT,
    tipo VARCHAR(50),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT FALSE,
    usuario_id INT,
    FOREIGN KEY(usuario_id)
        REFERENCES Usuario(usuario_id)
        ON DELETE CASCADE
);