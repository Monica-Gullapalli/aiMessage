const express = require('express');
const bodyParser = require('body-parser');
const { getCompletion, functions } = require('./function.js'); // Adjust the import as necessary

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the "public" directory

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  const messages = [{ role: 'user', content: question }];

  try {
    let response = await getCompletion(messages);

    while (response.choices[0].finish_reason !== 'stop') {
      if (response.choices[0].finish_reason === 'function_call') {
        const fnName = response.choices[0].message.function_call.name;
        const args = response.choices[0].message.function_call.arguments;
        const functionToCall = functions[fnName];
        const params = JSON.parse(args);
        const result = await functionToCall(params);

        messages.push({
          role: 'assistant',
          content: null,
          function_call: {
            name: fnName,
            arguments: args,
          },
        });

        messages.push({
          role: 'function',
          name: fnName,
          content: JSON.stringify({ result: result }),
        });

        response = await getCompletion(messages);
      }
    }

    res.json({ answer: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});