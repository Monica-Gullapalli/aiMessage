import express from 'express';
import bodyParser from 'body-parser';
import { getCompletion, functions } from './function.js';
import { search } from './search.js';
import { query } from './qa.js';
import { newMessage, formatMessage } from './chat.js';

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
  const { input, history } = req.body;
  const message = formatMessage(input);
  try {
    console.log('Received chat request:', { input, history });
    const response = await newMessage(history, message);
    if (response.content === null) {
      throw new Error('Response message content is null');
    }
    console.log('Sending chat response:', response.content);
    res.json({ answer: response.content });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/function', async (req, res) => {
  const { input } = req.body;
  const messages = [{ role: 'user', content: input }];
  try {
    const response = await getCompletion(messages);
    const answer = response.choices[0].message.content || 'No response';
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/qa', async (req, res) => {
  const { input } = req.body;
  try {
    const response = await query(input);
    res.json({ answer: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/search', async (req, res) => {
  const { input } = req.body;
  try {
    const results = await search(input);
    res.json({ result: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
