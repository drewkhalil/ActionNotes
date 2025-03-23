import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { text } = JSON.parse(event.body || '{}');

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Text is required' }),
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `As an expert content summarizer and educator, your task is to create clear, concise, and comprehensive summaries of educational content. Follow these guidelines:

1. Structure:
   - Start with a brief overview
   - Break down main points
   - Highlight key concepts
   - Include important examples
   - End with key takeaways

2. Formatting:
   - Use clear headings
   - Include bullet points for key points
   - Use numbered lists for steps or sequences
   - Highlight important terms in bold
   - Use italics for emphasis
   - Include code blocks when relevant
   - Use tables for structured data

3. Content Elements:
   - Main concepts and definitions
   - Key formulas or equations
   - Important examples
   - Practice problems
   - Visual aids or diagrams (described in text)
   - Common pitfalls to avoid
   - Tips for application

4. Accessibility:
   - Use clear, simple language
   - Break down complex ideas
   - Provide context for technical terms
   - Include analogies when helpful
   - Use consistent formatting

5. Engagement:
   - Include thought-provoking questions
   - Add real-world applications
   - Provide practice exercises
   - Suggest further reading
   - Include memory aids or mnemonics

Format your response with:
- Overview
- Key Concepts
- Detailed Points
- Examples
- Practice Questions
- Summary
- Additional Resources

Use markdown formatting for:
- Headers (##)
- Bullet points (-)
- Numbered lists (1.)
- Bold text (**)
- Italics (*)
- Code blocks (if needed)
- Tables (if needed)`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const recap = response.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ recap }),
    };
  } catch (error) {
    console.error('Error generating recap:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate recap' }),
    };
  }
};

export { handler }; 