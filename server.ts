// server.ts
// Main Express server entry point

import express from 'express';
import quickbooksAuth from './quickbooksAuth';
import quickbooksData from './quickbooksData';
import quickbooksWebhook from './quickbooksWebhook';

const app = express();
app.use(express.json());

app.use('/api', quickbooksAuth);
app.use('/api', quickbooksData);
app.use('/api', quickbooksWebhook);

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
