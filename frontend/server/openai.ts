import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System message to contextualize the chatbot's role
const SYSTEM_MESSAGE = `
You are CourseChat, a helpful assistant for Harvard University students looking for course recommendations.
You have knowledge of the Harvard course catalog and Q Guide ratings to help students find and filter courses.
Always respond in a conversational tone, but be precise about course information.

When recommending courses:
1. Consider the student's preferences for concentration, difficulty, workload, time slots, etc.
2. Mention relevant Q Guide ratings and workload estimates when available
3. Suggest courses that might fit the student's interests or requirements
4. Ask clarifying questions if needed to provide better recommendations

Respond with JSON in this format:
{
  "response": "Your conversational response here",
  "courses": [] (an array of recommended course IDs, if applicable),
  "filter_suggestions": {} (any filter suggestions based on the conversation)
}
`;

interface ChatbotResponse {
  response: string;
  courses: number[];
  filter_suggestions: Record<string, any>;
}

export async function getChatbotResponse(
  messages: { role: string; content: string }[],
  availableCourses: any[]
): Promise<ChatbotResponse> {
  try {
    // Create a context with course information
    const courseContext = availableCourses.map(c => 
      `Course ID: ${c.id}, Code: ${c.courseCode}, Title: ${c.title}, Instructor: ${c.instructor}, Q Rating: ${c.qGuideRating}, Workload: ${c.workload} hrs/week, Time: ${c.timeSlot}`
    ).join('\n');
    
    // Add system message with context
    const fullMessages = [
      { 
        role: "system", 
        content: `${SYSTEM_MESSAGE}\n\nHere are the available courses:\n${courseContext}`
      },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: fullMessages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(content || '{"response": "I apologize, but I encountered an issue processing your request.", "courses": [], "filter_suggestions": {}}');
    
    return {
      response: parsedResponse.response,
      courses: parsedResponse.courses || [],
      filter_suggestions: parsedResponse.filter_suggestions || {}
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      response: "I apologize, but I encountered an issue processing your request. Please try again later.",
      courses: [],
      filter_suggestions: {}
    };
  }
}
