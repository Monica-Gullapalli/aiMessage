import 'dotenv/config';
import { openai } from './openai.js';
import math from 'advanced-calculator';

const QUESTION = process.argv[2] || 'hi';

const messages = [
  {
    role: 'user',
    content: QUESTION,
  },
];

export const functions = {
  calculate({ expression }) {
    return math.evaluate(expression);
  },
  async generateImage({ prompt }) {
    const result = await openai.images.generate({ prompt });
    return result.data[0].url;
  },
};

export const getCompletion = async (messages) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-0613',
      messages,
      functions: [
        {
          name: 'calculate',
          description: 'Run a math expression',
          parameters: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
                description: 'The math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
              },
            },
            required: ['expression'],
          },
        },
        {
          name: 'generateImage',
          description: 'Create or generate image based on a description',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The description of the image that is to be generated',
              },
            },
            required: ['prompt'],
          },
        },
      ],
      temperature: 0,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices returned from OpenAI API');
    }

    return response;
  } catch (error) {
    console.error('Error getting completion:', error);
    throw error;
  }
};

// The following code is for testing purposes and should be removed or commented out in production
let response;
while (true) {
  try {
    response = await getCompletion(messages);

    if (response.choices[0].finish_reason === 'stop') {
      console.log(response.choices[0].message.content);
      break;
    } else if (response.choices[0].finish_reason === 'function_call') {
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
    }
  } catch (error) {
    console.error('Error in while loop:', error);
    break;
  }
}
