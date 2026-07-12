import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import env from '../config/env';
import logger from '../utils/logger';
import { processPublishPostJob } from '../jobs/publishPostJob';
let postQueue;
let worker;
const initializePostQueue = async () => { if (!env.redisUrl) { logger.warn('REDIS_URL missing. Post queue is disabled.');
    return; }
  const connection: any = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
  // Dedicated queue keeps post scheduling isolated from web request lifecycle.
  postQueue = new Queue('post-publish-queue', { connection });
  worker = new Worker(
    'post-publish-queue',
    async (job) => { await processPublishPostJob(job.data); },
    { connection }
  );
  worker.on('failed', (job, error) => { logger.error({ message: 'Post publish job failed', jobId: job?.id, error: error.message }); });
  logger.info('BullMQ post queue initialized'); };
const addSchedulePublishJob = async ({ postId, runAt }) => { if (!postQueue) { throw new Error('Post queue is not initialized. Ensure REDIS_URL is configured.'); }
  // BullMQ delay ensures publish occurs at the exact requested schedule time.
  const delay = Math.max(0, new Date(runAt).getTime() - Date.now());
  await postQueue.add(
    'publish-post',
    { postId },
    { delay,
      removeOnComplete: true,
      removeOnFail: 1000 }
  ); };
export { initializePostQueue, addSchedulePublishJob };
