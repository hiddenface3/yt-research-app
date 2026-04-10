import Groq from 'groq-sdk'

// Used ONLY for smart search — 1 call per user request
export async function generateSearchQueries(
  videoTitle: string,
  videoDescription: string,
  channelName: string
): Promise<string[]> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY is not set')
    return []
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const prompt = `You are a YouTube research assistant. A user wants to find YouTube channels SIMILAR to this video:

Title: "${videoTitle}"
Channel: "${channelName}"
Description: "${videoDescription.slice(0, 400)}"

Generate exactly 3 YouTube search queries that would find similar channels/videos with the same style, topic, and format. Focus on:
- The content niche/topic
- The storytelling style or format
- The target audience

Return ONLY a JSON array of 3 strings, nothing else. Example: ["query one", "query two", "query three"]`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 200,
  })

  const content = response.choices[0]?.message?.content?.trim() || '[]'

  try {
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) return []
    const queries = JSON.parse(match[0]) as string[]
    return queries.filter((q) => typeof q === 'string').slice(0, 3)
  } catch {
    return []
  }
}

// Extract YouTube video ID from any URL format
export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function isYouTubeUrl(input: string): boolean {
  return (
    input.includes('youtube.com/') ||
    input.includes('youtu.be/') ||
    /^[a-zA-Z0-9_-]{11}$/.test(input.trim())
  )
}
