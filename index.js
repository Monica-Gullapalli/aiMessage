import 'dotenv/config';
import OpenAI from "openai";

const openai = new OpenAI();

const results = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
        {role: "system", content: "You are an AI assistant. You will respond as per your abilities", },
        {role: "user", content: "Hi!"},
    ],
})

console.log(results.choices[0])

