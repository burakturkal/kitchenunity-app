// server.ts
// Main Express server entry point

import express from 'express';

const app = express();
app.use(express.json());

// Export the Express app for serverless adapters (do not call listen here)
export default app;
