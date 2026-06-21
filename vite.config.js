import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

function getApiKey() {
  try {
    const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/^VITE_ANTHROPIC_API_KEY=(.+)$/)
      if (m) return m[1].trim()
    }
  } catch {}
  return ''
}

export default defineConfig(() => {
  const apiKey = getApiKey()
  console.log('[anthropic proxy] key length:', apiKey.length)

  return {
    plugins: [
      react(),
      {
        name: 'anthropic-proxy',
        configureServer(server) {
          server.middlewares.use('/api/claude', (req, res) => {
            const chunks = []
            req.on('data', chunk => chunks.push(chunk))
            req.on('end', async () => {
              try {
                const body = Buffer.concat(chunks).toString()
                const upstream = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                  },
                  body,
                })
                const text = await upstream.text()
                res.writeHead(upstream.status, { 'content-type': 'application/json' })
                res.end(text)
              } catch (err) {
                console.error('[anthropic proxy] error:', err.message)
                if (!res.headersSent) {
                  res.writeHead(502)
                  res.end(JSON.stringify({ error: err.message }))
                }
              }
            })
          })
        },
      },
    ],
  }
})
