import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI();

const talkToGPT = async (message) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are an AI assistant, answer any questions to the best of your ability. !!!LETS THINK STEP BY STEP!!!',
      },
      {
        role: 'user',
        content: message,
      },
    ],
  });
  return (
    response?.choices[0]?.message?.content || 'I am sorry, I do not understand.'
  );
};

console.log(await talkToGPT('Hi!, my name is Alvaro.'));
