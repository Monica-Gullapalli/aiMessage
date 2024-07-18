import { openai } from "./openai.js";
import 'dotenv/config';
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';

const question = process.argv[2] || "hi";
const video = `https://www.youtube.com/watch?v=UA3HxaaTC8w`;

const createStore = (docs) => MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

const docsFromYTVideo = (video) => {
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

const docsFromPDF = () => {
    const loader = new PDFLoader('/Users/monicagullapalli/Documents/Frontend Masters/xbox.pdf');
    return loader.loadAndSplit(
        new CharacterTextSplitter({
            separator: '. ',
            chunkSize: 2500,
            chunkOverlap: 200,
        })
    );
};

const loadStore = async () => {
    const videoDocs = await docsFromYTVideo(video);
    const pdfDocs = await docsFromPDF();
    return createStore([...videoDocs, ...pdfDocs]);
};

export const query = async (inputQuestion) => {
    const store = await loadStore();
    const results = await store.similaritySearch(inputQuestion, 2);

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0,
        messages: [
            {
                role: 'system',
                content: 'You are an AI assistant. Answer questions to your best ability.',
            },
            {
                role: 'user',
                content: `Answer the following question using the provided context. If you cannot answer the question with the context, don't lie and make up stuff. Just say you need more context.
        Question: ${inputQuestion}
  
        Context: ${results.map((r) => r.pageContent).join('\n')}`,
            }
        ]
    });
    return `Answer: ${response.choices[0].message.content}\n\nSources: ${results.map((r) => r.metadata.source).join(', ')}`;
};

// For testing purposes, you can use the following code block
if (import.meta.url === `file://${process.argv[1]}`) {
    query(question).then(console.log);
}