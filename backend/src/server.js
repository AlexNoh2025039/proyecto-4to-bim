import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import usuarioRoutes from './routes/usuario.js';
import empresaRoutes from './routes/empresa.js';
import curriculumRoutes from './routes/curriculum.js';
import vacantesRoutes from './routes/vacante.js';
import postulacionesRoutes from './routes/postulacion.js';
import historialRoutes from './routes/historial.js';
import bancoPreguntasRoutes from './routes/bancoPreguntas.js';
import evaluacionRoutes from './routes/evaluacion.js';
import respuestaEvaluacionRoutes from './routes/respuestaEvaluacion.js';
import notificacionRoutes from './routes/notificacion.js';

const app = express();

app.set('etag', false);
app.set('x-powered-by', false);

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/curriculums', curriculumRoutes);
app.use('/api/vacantes', vacantesRoutes);
app.use('/api/postulaciones', postulacionesRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/banco-preguntas', bancoPreguntasRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use('/api/respuestas-evaluacion', respuestaEvaluacionRoutes);
app.use('/api/notificaciones', notificacionRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'TalentBridge-Backend', 
    timestamp: new Date() 
  });
});

const port = process.env.PORT || 3000;

export const server = app.listen(port, () => {
  console.log(`Servidor TalentBridge ejecutándose en http://localhost:${port}`);
});