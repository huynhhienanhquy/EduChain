import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import testRoutes from './routes/test.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import userRoutes from './routes/user.routes.js';


const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ message: 'EduChain backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

export default app;
