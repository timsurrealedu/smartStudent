import express from 'express'
import cors from 'cors'
import path from 'path'
import routes from './routes'

const app = express()
const PORT = Number(process.env.PORT || 3001)
const NODE_ENV = process.env.NODE_ENV || 'development'

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/api', routes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static frontend files in production
if (NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../frontend/dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SmartStudent API running on http://0.0.0.0:${PORT} [${NODE_ENV}]`)
})
