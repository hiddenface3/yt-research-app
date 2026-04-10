import Groq from 'groq-sdk'
import { searchYouTube, getChannelStats, getRecentChannelVideos } from './youtube'

// Sleep to respect rate limits (60 RPM means 1 per second average is super safe)
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export type AgentLog = {
  type: 'status' | 'thought' | 'tool_call' | 'tool_result' | 'final' | 'error'
  message: string
  data?: any
}

// Ensure safe instantiate
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_youtube',
      description: 'Search YouTube for videos. Returns video metadata including channel IDs. Crucial for finding initial leads.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
          maxResults: { type: 'number', description: 'Number of results to fetch (default: 10, max: 20)' },
          order: { type: 'string', enum: ['relevance', 'date', 'viewCount'], description: 'Sort order' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_channel_stats',
      description: 'Get deep statistics for a specific YouTube channel using its channel ID. Returns subscriber count, total views, etc.',
      parameters: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'The exact channel ID.' }
        },
        required: ['channelId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_videos',
      description: 'Fetch the most recent videos uploaded by a specific channel to analyze their current view velocity or performance.',
      parameters: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'The exact channel ID.' },
          maxResults: { type: 'number', description: 'How many recent videos to check (max 15).' }
        },
        required: ['channelId']
      }
    }
  }
]

export async function runDeepResearchAgent(
  prompt: string,
  onLog: (log: AgentLog) => void
) {
  if (!groq) {
    onLog({ type: 'error', message: 'GROQ_API_KEY is not configured.' })
    return null
  }

  const messages: any[] = [
    {
      role: 'system',
      content: `You are an elite YouTube Research AI Agent. 
Your goal is to deeply research YouTube channels and videos by continuously calling tools until you can perfectly answer the user's request.
You must use the provided tools to search, inspect channels, and verify recent video performance.
Do not guess or assume. Look at the real data. 
If looking for "low sub" channels with "high views", you MUST: 
1. Search conceptually.
2. Examine the returned channel IDs.
3. Call get_channel_stats on them to verify sub count.
4. Call get_recent_videos to verify their recent views.
When you have collected enough accurate data, write a detailed structural markdown summary of your findings as your final response.`
    },
    { role: 'user', content: prompt }
  ]

  let iterations = 0
  const MAX_ITERATIONS = 6 // Prevents infinite loops and too much quota usage

  onLog({ type: 'status', message: 'Agent initialized. Starting research loop...' })

  while (iterations < MAX_ITERATIONS) {
    iterations++
    
    // Rate limit ourselves explicitly against Groq (max 60 RPM)
    await delay(1200)

    onLog({ type: 'status', message: `Thinking... (Iteration ${iterations})` })

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools: TOOLS as any,
      tool_choice: 'auto',
      temperature: 0.3,
    })

    const responseMessage = response.choices[0]?.message
    if (!responseMessage) break

    // Add Groq's response to the conversation history
    messages.push(responseMessage)

    // Are there tool calls?
    const toolCalls = responseMessage.tool_calls
    if (!toolCalls || toolCalls.length === 0) {
      // The agent has decided it has finished and provided a text response
      onLog({ type: 'final', message: responseMessage.content || 'Finished without content.' })
      return responseMessage.content
    }

    // Process all parallel tool calls
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name
      const args = JSON.parse(toolCall.function.arguments || '{}')
      
      onLog({ 
        type: 'tool_call', 
        message: `Calling ${functionName}`,
        data: args
      })

      let toolResult: any

      try {
        if (functionName === 'search_youtube') {
          toolResult = await searchYouTube(args.query, args.maxResults || 10, args.order || 'relevance')
        } else if (functionName === 'get_channel_stats') {
          toolResult = await getChannelStats(args.channelId)
        } else if (functionName === 'get_recent_videos') {
          toolResult = await getRecentChannelVideos(args.channelId, args.maxResults || 5)
        } else {
          toolResult = { error: 'Unknown tool' }
        }
      } catch (err: any) {
        toolResult = { error: err.message }
      }

      const summaryStr = JSON.stringify(toolResult).slice(0, 500) + (JSON.stringify(toolResult).length > 500 ? '...(truncated)' : '')
      onLog({ 
        type: 'tool_result', 
        message: `Result from ${functionName}`,
        data: summaryStr 
      })

      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: functionName,
        content: JSON.stringify(toolResult),
      })
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    onLog({ type: 'status', message: 'Hit maximum iteration limit.' })
    
    // Force a final summary
    messages.push({
      role: 'user',
      content: 'You hit the maximum iteration limit. Please summarize what you have found so far.'
    })
    const finalResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.3,
    })
    
    onLog({ type: 'final', message: finalResponse.choices[0]?.message?.content || 'Unable to summarize.' })
    return finalResponse.choices[0]?.message?.content
  }
}
