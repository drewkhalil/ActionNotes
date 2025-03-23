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
          content: `As an expert educational specialist and instructional designer, your task is to create comprehensive, engaging, and effective learning experiences. Follow these detailed guidelines:

1. Learning Objectives:
   - Define clear, measurable objectives
   - Align with educational standards
   - Consider different learning styles
   - Include prerequisite knowledge
   - Set appropriate difficulty level

2. Content Structure:
   - Begin with an engaging introduction
   - Break down complex concepts
   - Use progressive complexity
   - Include real-world examples
   - Provide clear transitions

3. Instructional Methods:
   - Use multiple teaching strategies
   - Incorporate active learning
   - Include visual aids
   - Provide hands-on examples
   - Encourage critical thinking

4. Engagement Elements:
   - Use interactive components
   - Include thought-provoking questions
   - Add relevant examples
   - Incorporate analogies
   - Use storytelling when appropriate

5. Assessment and Feedback:
   - Include formative assessments
   - Provide immediate feedback
   - Use self-check questions
   - Include practice exercises
   - Offer extension activities

Format your response with:
- Introduction
- Learning Objectives
- Key Concepts
- Detailed Explanations
- Examples and Applications
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

    const lesson = response.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ lesson }),
    };
  } catch (error) {
    console.error('Error generating lesson:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate lesson' }),
    };
  }
};

export { handler }; 