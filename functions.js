import { openAI } from './openai.js';
import math from 'advanced-calculator';

const QUESTION = process.argv[2] || 'Hi';

const messages = [
  {
    role: 'user',
    content: QUESTION,
  },
];

const functions = {
  calculate({ expresion }) {
    return math.evaluate(expresion);
  },
  async generateImage({ prompt }) {
    const result = await openAI.images.generate({ prompt });
    return result.data[0].url;
  },
};

const getCompletion = async () => {
  return openAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages,
    functions: [
      {
        name: 'calculate',
        description: 'Run a math expression',
        parameters: {
          type: 'object',
          properties: {
            expresion: {
              type: 'string',
              description:
                'The math expression to evaluate like "2 * 3 + (4 / 2) ^ 2"',
            },
          },
          required: ['expresion'],
        },
      },
      {
        name: 'generateImage',
        description: 'A function to generate an image',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description:
                'The prompt to generate the image from, like "A cat in the jungle"',
            },
          },
          required: ['prompt'],
        },
      },
    ],
  });
};

let response;
while (true) {
  response = await getCompletion();
  if (response.choices[0].finish_reason === 'stop') {
    console.log(response.choices[0].message.content);
    break;
  } else if (response.choices[0].finish_reason === 'function_call') {
    const name = response.choices[0].message.function_call.name;
    const args = response.choices[0].message.function_call.arguments;

    const funcToCall = functions[name];
    const params = JSON.parse(args);
    const result = await funcToCall(params);

    messages.push({
      role: 'assistant',
      content: null,
      function_call: {
        name,
        arguments: args,
      },
    });

    messages.push({
      role: 'function',
      name,
      content: JSON.stringify({ result }),
    });
  }
}
