import { NextRequest } from 'next/server'
import { runDeepResearchAgent } from '@/lib/agent'

export const maxDuration = 60 // Allow up to 60 seconds on hobby plan (depending on platform)

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return new Response('Missing prompt', { status: 400 })

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendLog = (log: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`))
          }

          // Run the agent loop
          await runDeepResearchAgent(prompt, sendLog)
          
          controller.close()
        } catch (err: any) {
          console.error('Agent loop crashed:', err)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
