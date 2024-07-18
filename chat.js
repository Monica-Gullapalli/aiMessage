import { openai } from "./openai.js";
import readline from "node:readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

export const newMessage = async (history, message) => {
    try {
      console.log('Sending message to OpenAI:', message);
      const results = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [...history, message],
      });
  
      console.log('Received response from OpenAI:', results);
  
      if (!results.choices || results.choices.length === 0) {
        throw new Error('No choices returned from OpenAI API');
      }
  
      const responseMessage = results.choices[0].message;
      console.log('Response message:', responseMessage);
  
      if (responseMessage && responseMessage.content !== null) {
        return responseMessage;
      } else {
        console.log('Invalid response:', responseMessage);
        throw new Error('Response message content is null or missing');
      }
    } catch (error) {
      console.error('Error getting new message:', error);
      throw error;
    }
  };

export const formatMessage = (userInput) => ({ role: 'user', content: userInput });

const chat = () => {
    const history = [
        { role: 'system', content: " " },
    ];
    const start = () => {
        rl.question("You: ", async (userInput) => {
            if (userInput.toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            const message = formatMessage(userInput);
            try {
                const response = await newMessage(history, message);
                history.push(message, response);
                console.log(`\n\nAI: ${response.content}`);
            } catch (error) {
                console.error('Error in chat:', error);
            }
            start();
        });
    };
    start();
};

console.log("Chatbot initialized. Type 'exit' to end chat.");
chat();