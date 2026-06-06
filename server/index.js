const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const cluster = require('cluster');
const os = require('os');
const rateLimit = require('express-rate-limit');
const prometheus = require('prom-client');
const logger = require('./utils/logger');
const { createPool } = require('./db/pool');
const redisClient = require('./cache/redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const numCPUs = os.cpus().length;

// ===== CLUSTERING FOR HORIZONTAL SCALING =====
if (cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`);
  
  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    // Respawn dead workers
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit(0);
  });

  return;
}

// ===== MIDDLEWARE =====
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  maxAge: 86400 // 24 hours
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ===== PROMETHEUS METRICS =====
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

prometheus.collectDefaultMetrics();

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });
  next();
});

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new (require('rate-limit-redis'))({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
});

app.use('/api/', limiter);

// ===== HEALTH CHECKS =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    worker_pid: process.pid
  });
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});

app.get('/ready', async (req, res) => {
  try {
    const db = await createPool();
    const dbResult = await db.query('SELECT 1');
    const redisResult = await redisClient.ping();
    
    if (dbResult && redisResult === 'PONG') {
      res.json({ ready: true });
    } else {
      res.status(503).json({ ready: false });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({ ready: false, error: error.message });
  }
});

// ===== ROUTES =====
app.use('/api/questions', require('./routes/questions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/results', require('./routes/results'));

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      status: err.status || 500
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ===== START SERVER =====
const server = app.listen(PORT, () => {
  logger.info(`Worker ${process.pid} listening on port ${PORT}`);
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await redisClient.quit();
    process.exit(0);
  });
});

module.exports = app;
