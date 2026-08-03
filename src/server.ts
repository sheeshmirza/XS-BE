//Done

import app from "./app";
import { connectDatabase } from "./config/database";
import env from "./config/env";
import { initializePostQueue } from "./queue/postQueue";
import postService from "./services/postService";

const startServer = async () => {
  await connectDatabase();
  await initializePostQueue();
  await postService.requeueRecurringScheduledPostsOnStartup();
  app.listen(env.port, () => {
    console.log(`XS-BE running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error({ message: "Failed to start server", error });
  process.exit(1);
});
