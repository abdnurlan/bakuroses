import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { Queue, Worker } from 'bullmq';
import { redis } from './redis';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  template: string,
  vars: object
) {
  const candidates = [
    path.join(__dirname, `../templates/${template}.hbs`),
    path.join(process.cwd(), `src/templates/${template}.hbs`),
  ];
  const templatePath = candidates.find(p => fs.existsSync(p));
  if (!templatePath) {
    throw new Error(`Email template not found: ${template}`);
  }
  const src = fs.readFileSync(templatePath, 'utf8');
  const html = handlebars.compile(src)(vars);

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME ?? 'Baku Roses'}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}

let emailQueue: Queue | null = null;

function initEmailQueue() {
  if (emailQueue) return;
  try {
    const q = new Queue('emails', { connection: redis });
    q.on('error', (err) => console.warn('⚠️  Email queue error:', err.message));

    const w = new Worker(
      'emails',
      async (job) => {
        const { to, subject, template, vars } = job.data;
        await sendEmail(to, subject, template, vars);
      },
      { connection: redis }
    );
    w.on('error', (err) => console.warn('⚠️  Email worker error:', err.message));

    emailQueue = q;
  } catch (err) {
    console.warn('⚠️  Could not init email queue:', (err as Error).message);
  }
}

initEmailQueue();

export async function queueEmail(
  to: string,
  subject: string,
  template: string,
  vars: object
) {
  if (!emailQueue) {
    console.warn('Email queue not available, sending directly:', to, subject);
    await sendEmail(to, subject, template, vars).catch(console.error);
    return;
  }
  await emailQueue.add(
    'send',
    { to, subject, template, vars },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    }
  );
}
