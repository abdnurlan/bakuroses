import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';

import { initSocket } from './services/socket';
import { assertPaymentConfig } from './config/payment';
import { startChewickPoller, stopChewickPoller } from './services/chewickPoller';
import { chewickLogout } from './services/chewick';

import zonesRouter from './routes/zones';
import ordersRouter from './routes/orders';
import paymentsRouter from './routes/payments';
import deliveriesRouter from './routes/deliveries';
import productsRouter from './routes/products';
import adminRouter from './routes/admin';
import promoCodesRouter from './routes/promoCodes';
import categoriesRouter from './routes/categories';

// Fail the boot, not the first checkout, if the gateway is misconfigured.
assertPaymentConfig();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

initSocket(io);

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Gateway callbacks must be open to all origins — they come from Payriff /
// Chewick servers, not from a browser on our domain.
app.use('/api/payments/callback', cors({ origin: '*' }));
app.use('/api/payments/chewick/callback', cors({ origin: '*' }));

app.use('/api/zones', zonesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/promo-codes', promoCodesRouter);
app.use('/api/categories', categoriesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT ?? 3002);
server.listen(PORT, () => {
  console.log(`🚀 Bakuroses API running on http://localhost:${PORT}`);
  startChewickPoller();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    stopChewickPoller();
    void chewickLogout().finally(() => process.exit(0));
  });
}

export { io };
