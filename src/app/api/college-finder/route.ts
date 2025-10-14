import { NextRequest } from "next/server";
import { mockColleges } from "@/lib/mockData";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Mock Data Retrieval - Filter relevant colleges
    const searchTerms = query.toLowerCase().split(" ");
    const relevantColleges = mockColleges.filter((college) => {
      const searchableText = `
        ${college.name} ${college.location} ${college.courses.join(" ")} 
        ${college.highlights.join(" ")}
      `.toLowerCase();

      return searchTerms.some(
        (term: string) =>
          searchableText.includes(term) ||
          college.courses.some((course) => course.toLowerCase().includes(term))
      );
    });

    // 2. Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let responseText: string;

          if (process.env.GEMINI_API_KEY) {
            responseText = await callGeminiAPI(query, relevantColleges);
          } else {
            responseText = generateFallbackResponse(query, relevantColleges);
          }

          // Stream the response word by word
          const words = responseText.split(" ");

          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? " " : "");
            controller.enqueue(new TextEncoder().encode(chunk));

            // Natural typing speed (30-70ms between words)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.random() * 40 + 30)
            );
          }

          controller.close();
        } catch (error) {
          const errorMessage =
            "Unable to fetch college recommendations at the moment. Please try again in a few moments.";
          controller.enqueue(new TextEncoder().encode(errorMessage));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function callGeminiAPI(
  query: string,
  colleges: typeof mockColleges
): Promise<string> {
  const prompt = `You are an AI college admission counselor. A student is searching for: "${query}"

Here are the relevant colleges I found based on their query:
${JSON.stringify(colleges.slice(0, 3), null, 2)}

Please provide a helpful, personalized response that:
1. Acknowledges their search query
2. Highlighting 2-3 most relevant colleges from the data with specific details
3. Compares key aspects like fees, courses, ratings, and placement opportunities
4. Provides practical next steps or considerations
5. Keeps the response conversational, encouraging, and around 150-200 words

Format the response in clear paragraphs without markdown. Be specific about the colleges mentioned and why they might be a good fit.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    // Fallback to basic response if Gemini fails
    return generateFallbackResponse(query, colleges);
  }
}

function generateFallbackResponse(
  query: string,
  colleges: typeof mockColleges
): string {
  if (colleges.length === 0) {
    return `I searched for colleges related to "${query}" but couldn't find exact matches in our database. You might want to try broader search terms like "engineering in Delhi" or "computer science courses".`;
  }

  let response = `Based on your search for "${query}", I found ${colleges.length} relevant colleges:\n\n`;

  colleges.slice(0, 3).forEach((college) => {
    response += `🏫 ${college.name}\n`;
    response += `📍 ${college.location} | ⭐ ${college.rating}/5 | 💰 ${college.fees}\n`;
    response += `📚 Top Courses: ${college.courses.slice(0, 2).join(", ")}\n`;
    response += `🎯 ${college.highlights[0]}\n\n`;
  });

  response += `These are great options to consider! I recommend visiting their official websites for detailed admission information and campus tours.`;

  return response;
}
