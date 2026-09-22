import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import usuarioRoutes from './routes/UsuarioRouter.js';
import empresaRoutes from './routes/EmpresaRouter.js';
import curriculumRoutes from './routes/CurriculumRouter.js';
import vacantesRoutes from './routes/VacantesRouter.js';
import postulacionesRoutes from './routes/PostulacionesRouter.js';
import historialRoutes from './routes/HistorialRouter.js';
import bancoPreguntasRoutes from './routes/BancoPreguntasRouter.js';
import evaluacionRoutes from './routes/EvaluacionRouter.js';
import respuestaEvaluacionRoutes from './routes/RespuestaEvaluacionRouter.js';
import notificacionRoutes from './routes/NotificacionesRouter.js';

const app = express();

app.set('etag', false);
app.set('x-powered-by', false);

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(cors());
app.use(express.json({
  limit: '16mb'
}));

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
    service: 'TalentBridge-Backend'
  });
});

const port = process.env.PORT || 3000;

export const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor TalentBridge ejecutándose en http://localhost:${port}`);
});
