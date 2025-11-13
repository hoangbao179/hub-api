// src/app.ts
import * as dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';

import router from './routers';
import { initDatabase } from '././db'; // đảm bảo bạn đã có file db.ts như đã hướng dẫn

async function bootstrap() {
  try {
    // 1) Init Database (tạo DB/bảng nếu chưa có)
    await initDatabase();

    // 2) Init Express
    const app = express();

    // Middlewares cơ bản
    app.use(bodyParser.json({ limit: '1mb' }));
    app.use(bodyParser.urlencoded({ extended: false }));

    // Healthcheck
    app.get('/_healthz', (_req, res) => res.status(200).send('OK'));

    // API routes
    app.use('/api', router);

    // 404 handler
    app.use((_req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Global error handler (đảm bảo không lộ stack ra ngoài)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('[ERROR]', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // 3) Start server
    const PORT = Number(process.env.PORT || 8080);
    const HOST = process.env.HOST || '0.0.0.0';

    const server = app.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`[${signal}] Shutting down...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
      // Nếu sau 10s chưa thoát, force exit
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[APP] Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
