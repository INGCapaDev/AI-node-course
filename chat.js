import { createBrotliCompress } from 'node:zlib';
import { openAI } from './openai.js';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const newMessage = async (history, message) => {
  const chatCompletion = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [...history, message],
  });
  return (
    chatCompletion?.choices[0]?.message || {
      role: 'system',
      content: 'I am sorry, something went wrong.',
    }
  );
};

const formatMessage = (userInput) => ({ role: 'user', content: userInput });

const chat = async () => {
  let history = [
    {
      role: 'system',
      content:
        'You are an AI assistant, answer any questions to the best of your ability. !!!LETS THINK STEP BY STEP!!!',
    },
  ];
  const start = () => {
    rl.question('You: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        rl.close();
        return;
      }
      const userMessage = formatMessage(userInput);
      const response = await newMessage(history, userMessage);
      history.push(userMessage, response);
      console.log(`\n\nAI: ${response.content}\n\n`);
      start();
    });
  };
  start();
};

await chat();
