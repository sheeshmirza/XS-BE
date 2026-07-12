//Reviewed

import Redis from "ioredis";
import { Job, Queue, Worker } from "bullmq";

import env from "../config/env";
import { processPublishPostJob } from "../jobs/publishPostJob";
import logger from "../utils/logger";

let postQueue: Queue | null = null;
let worker: Worker | null = null;

const initializePostQueue = async (): Promise<void> => {
  if (!env.redisUrl) {
    logger.warn("REDIS_URL missing. Post queue is disabled.");
    return;
  }
  if (postQueue && worker) {
    logger.info("BullMQ post queue already initialized");
    return;
  }
  const connection = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
  });
  postQueue = new Queue("scheduled-posts-queue", {
    connection: connection as any,
  });
  worker = new Worker(
    "scheduled-posts-queue",
    async (job: Job) => {
      await processPublishPostJob(job.data);
    },
    {
      connection: connection as any,
    },
  );
  worker.on("failed", (job, error) => {
    logger.error({
      message: "Post publish job failed",
      jobId: job?.id,
      error: error.message,
    });
  });
  worker.on("error", (error) => {
    logger.error({
      message: "BullMQ worker error",
      error: error.message,
    });
  });
  logger.info("BullMQ post queue initialized");
};

interface AddSchedulePublishJobParams {
  postId: string;
  runAt: Date | string;
}

const addSchedulePublishJob = async ({
  postId,
  runAt,
}: AddSchedulePublishJobParams): Promise<void> => {
  if (!postQueue) {
    throw new Error(
      "Post queue is not initialized. Ensure BullMQ is configured.",
    );
  }
  const timestamp = new Date(runAt).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error("Invalid runAt date");
  }
  const delay = Math.max(0, timestamp - Date.now());
  await postQueue.add(
    "publish-post",
    { postId },
    {
      delay,
      removeOnComplete: true,
      removeOnFail: 1000,
    },
  );
};

export { initializePostQueue, addSchedulePublishJob };
