#!/usr/bin/env node
/**
 * Generate character portraits using Google Gemini Imagen API
 * Usage: node scripts/generate-portrait.mjs <character_name> [count=4]
 *
 * Reads character data from Supabase admin API, generates art prompt,
 * and creates portrait images via Gemini Imagen 3.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Load .env.local
const envPath = path.join(ROOT, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.replace(/\r/g, '').split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const GEMINI_API_KEY = env.GEMINI_API_KEY
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not found in .env.local')
  process.exit(1)
}

// --- Art prompt generation (mirrors src/lib/artPrompt.ts) ---

function describeAge(age) {
  if (age <= 20) return 'young'
  if (age <= 30) return 'young adult'
  if (age <= 45) return 'middle-aged'
  if (age <= 60) return 'mature'
  return 'elderly'
}

function describeBody(chars) {
  const str = chars.STR ?? 50
  const siz = chars.SIZ ?? 50
  const con = chars.CON ?? 50
  const parts = []

  if (siz >= 75 && str >= 70) parts.push('large, muscular build')
  else if (siz >= 75) parts.push('tall, large frame')
  else if (siz <= 35) parts.push('small, slight build')
  else if (str >= 75) parts.push('muscular, athletic build')
  else if (str <= 30 && siz <= 45) parts.push('thin, frail build')

  if (con >= 80) parts.push('robust and healthy')
  else if (con <= 30) parts.push('sickly appearance')

  return parts.join(', ')
}

function describeAppearance(app) {
  if (app >= 80) return 'strikingly beautiful'
  if (app >= 70) return 'very attractive'
  if (app >= 60) return 'good-looking'
  if (app <= 25) return 'ugly, unsettling features'
  if (app <= 35) return 'plain, unremarkable face'
  return ''
}

function generatePortraitPrompt(char) {
  const parts = []

  const genderWord = char.gender === 'Kobieta' ? 'woman' : char.gender === 'Mężczyzna' ? 'man' : 'person'
  const ageDesc = describeAge(char.age)

  // Bust portrait, black and white / sepia style
  parts.push(`Vintage 1920s portrait photograph, bust shot from chest up, ${ageDesc} ${genderWord}, ${char.age} years old`)

  // Occupation
  if (char.occupation_name) {
    parts.push(`${char.occupation_name} by profession`)
  }

  // Appearance from backstory
  const appearance = char.backstory?.appearance_description || char.appearance || ''
  if (appearance) {
    const firstSentence = appearance.split(/[.!]/).filter(Boolean)[0]?.trim()
    if (firstSentence && firstSentence.length <= 150) {
      parts.push(firstSentence)
    }
  }

  // Body type
  const body = describeBody(char.characteristics || {})
  if (body) parts.push(body)

  // Attractiveness
  const appDesc = describeAppearance(char.characteristics?.APP ?? 50)
  if (appDesc) parts.push(appDesc)

  // Traits
  const traits = char.backstory?.traits
  if (traits && typeof traits === 'string' && traits.length <= 100) {
    parts.push(traits)
  }

  // Visual cues from art_notes if present
  if (char.art_notes) {
    parts.push(char.art_notes)
  }

  // Scars/injuries from backstory
  const backstoryText = JSON.stringify(char.backstory || {}).toLowerCase()
  if (backstoryText.includes('oparz') || backstoryText.includes('burn') || backstoryText.includes('blizn')) {
    parts.push('visible burn scars on face')
  }

  // Style
  parts.push('black and white photograph with slight sepia toning, soft blurred light background, dramatic studio lighting, highly detailed face, realistic, 1920s aesthetic')

  return parts.filter(Boolean).join(', ')
}

// --- Gemini Imagen API ---

async function generateImage(prompt, outputPath) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const body = {
    contents: [{
      parts: [{ text: `Generate a portrait image based on this description. Do not add any text or watermarks to the image.\n\n${prompt}` }]
    }],
    generationConfig: {
      responseModalities: ['IMAGE'],
    }
  }

  console.log('  Calling Gemini 2.5 Flash Image...')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  // Find image part in response
  const candidates = data.candidates || []
  if (candidates.length === 0) {
    throw new Error('No candidates in response')
  }

  const parts = candidates[0].content?.parts || []
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))

  if (!imagePart) {
    // Log text parts for debugging
    const textParts = parts.filter(p => p.text).map(p => p.text).join('\n')
    if (textParts) console.log('  Model response:', textParts.slice(0, 200))
    throw new Error('No image in response')
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
  const ext = imagePart.inlineData.mimeType === 'image/jpeg' ? '.jpg' : '.png'
  // Update output path extension if needed
  const finalPath = outputPath.replace(/\.[^.]+$/, ext)
  fs.writeFileSync(finalPath, buffer)
  console.log(`  Saved: ${finalPath}`)
  return finalPath
}

// --- Fetch character from admin API ---

async function fetchCharacters() {
  const adminPassword = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

  if (adminPassword) {
    // Use admin edge function
    const url = `${SUPABASE_URL}/functions/v1/admin/characters`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'X-Admin-Password': adminPassword,
      }
    })
    if (response.ok) return response.json()
    console.warn(`Admin API failed (${response.status}), trying direct query...`)
  }

  // Fallback: direct Supabase REST API (uses anon key, requires RLS allow)
  const url = `${SUPABASE_URL}/rest/v1/characters?select=*`
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  })

  if (!response.ok) {
    throw new Error(`Supabase query error ${response.status}: ${await response.text()}`)
  }

  return response.json()
}

function findCharacter(characters, nameQuery) {
  const q = nameQuery.toLowerCase()
  return characters.find(c =>
    c.name?.toLowerCase().includes(q) ||
    c.backstory?.name?.toLowerCase().includes(q)
  )
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: node scripts/generate-portrait.mjs <character_name> [count=4]')
    console.log('       node scripts/generate-portrait.mjs --prompt "custom prompt" [count=4]')
    console.log('       node scripts/generate-portrait.mjs --list')
    process.exit(0)
  }

  if (args[0] === '--list') {
    console.log('Fetching characters...')
    const chars = await fetchCharacters()
    for (const c of chars) {
      console.log(`  ${c.name || c.backstory?.name || 'unnamed'} (${c.id})`)
    }
    return
  }

  const outputDir = path.join(ROOT, 'generated_portraits')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  let prompt
  let baseName
  let count = 4

  if (args[0] === '--prompt') {
    prompt = args[1]
    baseName = 'custom'
    count = parseInt(args[2]) || 4
  } else {
    const charName = args[0]
    count = parseInt(args[1]) || 4

    console.log(`Fetching characters to find "${charName}"...`)
    const chars = await fetchCharacters()
    const char = findCharacter(chars, charName)

    if (!char) {
      console.error(`Character "${charName}" not found. Available:`)
      for (const c of chars) {
        console.log(`  ${c.name || c.backstory?.name || 'unnamed'}`)
      }
      process.exit(1)
    }

    console.log(`Found: ${char.name || char.backstory?.name}`)
    prompt = generatePortraitPrompt(char)
    baseName = (char.name || char.backstory?.name || 'char')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+$/, '')
  }

  console.log(`\nPrompt: ${prompt}\n`)
  console.log(`Generating ${count} portraits...`)

  // Check existing files to find next version number
  const existing = fs.readdirSync(outputDir).filter(f => f.startsWith(`${baseName}_gemini_`))
  const version = existing.length > 0 ? 'v' + (Math.floor(existing.length / count) + 1) + '_' : ''

  const results = []
  for (let i = 1; i <= count; i++) {
    const filename = `${baseName}_gemini_${version}${i}.png`
    const outputPath = path.join(outputDir, filename)
    console.log(`\n[${i}/${count}] Generating ${filename}...`)

    // Retry logic for rate limits
    let success = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await generateImage(prompt, outputPath)
        results.push(path.basename(result))
        success = true
        break
      } catch (err) {
        if (err.message.includes('429') && attempt < 3) {
          const wait = 15 * attempt
          console.log(`  Rate limited, waiting ${wait}s before retry...`)
          await new Promise(r => setTimeout(r, wait * 1000))
        } else {
          console.error(`  Error: ${err.message.slice(0, 200)}`)
          break
        }
      }
    }

    // Delay between images to avoid rate limits
    if (success && i < count) {
      console.log('  Waiting 10s before next image...')
      await new Promise(r => setTimeout(r, 10000))
    }
  }

  console.log(`\nDone! Generated ${results.length}/${count} portraits.`)
  if (results.length > 0) {
    console.log(`Files in: ${outputDir}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
