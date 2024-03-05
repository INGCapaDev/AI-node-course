import { createBrotliCompress } from 'node:zlib';
import { openAI } from './openai.js';
import readline from 'node:readline';

const INITIAL_HISTORY = [
  {
    role: 'system',
    content:
      'You are an AI assistant, answer any questions to the best of your ability. !!!LETS THINK STEP BY STEP!!!',
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const newMessage = async (history, message) => {
  const chatCompletion = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [...history, message],
    temperature: 0.2,
  });
  return (
    chatCompletion?.choices[0]?.message || {
      role: 'system',
      content: 'I am sorry, something went wrong.',
    }
  );
};

const formatMessage = (userInput) => ({ role: 'user', content: userInput });

const userWantToQuit = (userInput) => {
  const quitWords = ['quit', 'exit', 'goodbye', 'bye'];
  if (quitWords.includes(userInput.toLowerCase())) {
    console.log('\n\nAI: Goodbye!, see you soon.');
  }
  return quitWords.includes(userInput.toLowerCase());
};

const think = async (userInput, history) => {
  console.log('Thinking...');
  const userMessage = formatMessage(userInput);
  const response = await newMessage(history, userMessage);
  history.push(userMessage, response);
  console.log(`\n\nAI: ${response.content}`);
};

const chat = async () => {
  let history = INITIAL_HISTORY;
  const start = () => {
    rl.question('\n\nYou: ', async (userInput) => {
      if (userWantToQuit(userInput)) return rl.close();
      await think(userInput, history);
      start();
    });
  };
  start();
};

await chat();
