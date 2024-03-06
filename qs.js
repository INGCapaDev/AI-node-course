import { openAI } from './openai.js';
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';

const question = process.argv[2] || 'What is the meaning of life?';
const video = 'https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn';

export const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

export const docsFromYTVideo = async (video) => {
  const loader = YoutubeLoader.createFromUrl(video, {
    language: 'en',
    addVideoInfo: true,
  });
  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 2500,
      chunkOverlap: 100,
    })
  );
};

export const docsFromPDF = async (path) => {
  const loader = new PDFLoader(path);
  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 2500,
      chunkOverlap: 100,
    })
  );
};

const loadStore = async () => {
  const [ytDocs, pdfDocs] = await Promise.all([
    docsFromYTVideo(video),
    docsFromPDF('./xbox.pdf'),
  ]);

  return createStore([...ytDocs, ...pdfDocs]);
};

const query = async () => {
  const store = await loadStore();
  const result = await store.similaritySearch(question, 2);
  console.log('Thinking...');

  const response = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant. Answer questions to your best ability.',
      },
      {
        role: 'user',
        content: `Answer the following question using the provided content. If you cannot answer the question with the context, don't lie and make up stuff, in that case just say you don't know how to answer or that you need more information.
        Question: ${question}
        
        Context: ${result.map((r) => r.pageContent).join('\n')}`,
      },
    ],
  });
  console.log(response.choices[0].message.content);
};

query();
