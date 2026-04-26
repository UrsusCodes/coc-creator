#!/usr/bin/env node
/**
 * Generate character portraits via Gemini web chat using Playwright.
 * Uses existing Chrome profile (with Google login) to access gemini.google.com.
 *
 * Usage:
 *   node scripts/gemini-browser-gen.mjs <character_name> [count=4]
 *   node scripts/gemini-browser-gen.mjs --prompt "custom prompt" [count=4]
 *   node scripts/gemini-browser-gen.mjs --list
 *
 * IMPORTANT: Close Chrome before running this script!
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'generated_portraits')

import os from 'os'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const USER_DATA_DIR = 'C:\\Users\\Pawel\\AppData\\Local\\Google\\Chrome\\User Data'
const PROFILE_DIR = 'Profile 4'

function copyProfileToTemp() {
  const tempDir = path.join(os.tmpdir(), 'gemini-chrome-profile-' + Date.now())
  const srcProfile = path.join(USER_DATA_DIR, PROFILE_DIR)
  const destProfile = path.join(tempDir, PROFILE_DIR)

  console.log('Copying Chrome profile to temp directory...')
  fs.mkdirSync(destProfile, { recursive: true })

  // Copy essential files for login session (cookies, local state)
  const essentialFiles = [
    'Cookies', 'Cookies-journal',
    'Login Data', 'Login Data-journal',
    'Web Data', 'Web Data-journal',
    'Preferences', 'Secure Preferences',
  ]

  for (const file of essentialFiles) {
    const src = path.join(srcProfile, file)
    const dest = path.join(destProfile, file)
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dest)
      } catch (e) {
        // Some files may be locked, skip them
      }
    }
  }

  // Copy Local State from parent dir
  const localState = path.join(USER_DATA_DIR, 'Local State')
  if (fs.existsSync(localState)) {
    try {
      fs.copyFileSync(localState, path.join(tempDir, 'Local State'))
    } catch (e) {}
  }

  console.log(`Profile copied to: ${tempDir}`)
  return tempDir
}

// --- Load env & fetch characters (reuse from generate-portrait.mjs) ---

const envPath = path.join(ROOT, '.env.local')
const env = {}
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').replace(/\r/g, '').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim()
  }
}

async function fetchCharacters() {
  const SUPABASE_URL = env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL not in .env.local')

  const url = `${SUPABASE_URL}/rest/v1/characters?select=*`
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  })
  if (!response.ok) throw new Error(`Supabase error ${response.status}`)
  return response.json()
}

function findCharacter(characters, nameQuery) {
  const q = nameQuery.toLowerCase()
  return characters.find(c =>
    c.name?.toLowerCase().includes(q) ||
    c.backstory?.name?.toLowerCase().includes(q)
  )
}

// --- Prompt generation ---

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

  parts.push(`Vintage 1920s portrait photograph, bust shot from chest up, ${ageDesc} ${genderWord}, ${char.age} years old`)

  if (char.occupation_name) parts.push(`${char.occupation_name} by profession`)

  const appearance = char.backstory?.appearance_description || char.appearance || ''
  if (appearance) {
    const firstSentence = appearance.split(/[.!]/).filter(Boolean)[0]?.trim()
    if (firstSentence && firstSentence.length <= 150) parts.push(firstSentence)
  }

  const body = describeBody(char.characteristics || {})
  if (body) parts.push(body)

  const appDesc = describeAppearance(char.characteristics?.APP ?? 50)
  if (appDesc) parts.push(appDesc)

  const traits = char.backstory?.traits
  if (traits && typeof traits === 'string' && traits.length <= 100) parts.push(traits)

  if (char.art_notes) parts.push(char.art_notes)

  const backstoryText = JSON.stringify(char.backstory || {}).toLowerCase()
  if (backstoryText.includes('oparz') || backstoryText.includes('burn') || backstoryText.includes('blizn')) {
    parts.push('visible burn scars on face')
  }

  parts.push('black and white photograph with slight sepia toning, soft blurred light background, dramatic studio lighting, highly detailed face, realistic, 1920s aesthetic')

  return parts.filter(Boolean).join(', ')
}

// --- Browser automation ---

async function downloadImage(page, imgElement, outputPath) {
  // Try to get image src and download it
  const src = await imgElement.getAttribute('src')

  if (src && src.startsWith('data:')) {
    // Base64 data URI
    const match = src.match(/^data:image\/(\w+);base64,(.+)$/)
    if (match) {
      const buffer = Buffer.from(match[2], 'base64')
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
      const finalPath = outputPath.replace(/\.[^.]+$/, '.' + ext)
      fs.writeFileSync(finalPath, buffer)
      return finalPath
    }
  }

  if (src && src.startsWith('http')) {
    // Download via fetch in browser context
    const base64 = await page.evaluate(async (url) => {
      const res = await fetch(url)
      const blob = await res.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    }, src)

    const match = base64.match(/^data:image\/(\w+);base64,(.+)$/)
    if (match) {
      const buffer = Buffer.from(match[2], 'base64')
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
      const finalPath = outputPath.replace(/\.[^.]+$/, '.' + ext)
      fs.writeFileSync(finalPath, buffer)
      return finalPath
    }
  }

  // Fallback: screenshot the element
  const finalPath = outputPath.replace(/\.[^.]+$/, '.png')
  await imgElement.screenshot({ path: finalPath })
  return finalPath
}

async function generateViaGeminiChat(prompt, baseName, count) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('Launching Chrome...\n')

  // Use a persistent temp profile — login once, reuse in future runs
  const persistentProfile = path.join(ROOT, '.gemini-chrome-profile')
  if (!fs.existsSync(persistentProfile)) fs.mkdirSync(persistentProfile, { recursive: true })

  const context = await chromium.launchPersistentContext(persistentProfile, {
    executablePath: CHROME_PATH,
    channel: 'chrome',
    headless: false,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
    ],
    viewport: { width: 1280, height: 900 },
  })

  const page = await context.newPage()
  const results = []

  try {
    console.log('Navigating to Gemini...')
    await page.goto('https://gemini.google.com/app', { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(3000)

    // Check if we need to login — wait for user to do it manually
    const needsLogin = await page.$('button:has-text("Sign in"), a:has-text("Sign in"), button:has-text("Accept all"), button:has-text("Zaakceptuj")')
    if (needsLogin) {
      console.log('\n=== LOGOWANIE WYMAGANE ===')
      console.log('Zaloguj się do Google w otwartym oknie przeglądarki.')
      console.log('Skrypt automatycznie przejmie sterowanie gdy Gemini się załaduje.')
      console.log('Czekam...\n')

      // Wait until Gemini chat input appears (means user is logged in)
      await page.waitForSelector(
        'div[contenteditable="true"], rich-textarea, .ql-editor, textarea[aria-label]',
        { timeout: 300000 } // 5 min to login
      )
      console.log('Zalogowano! Zaczynam generowanie...\n')
      await page.waitForTimeout(2000)
    }

    for (let i = 1; i <= count; i++) {
      console.log(`\n[${i}/${count}] Generating image...`)

      // Find the input field
      const inputSelectors = [
        'div[contenteditable="true"]',
        'rich-textarea div[contenteditable="true"]',
        '.ql-editor',
        'textarea',
        '[aria-label*="prompt"]',
        '[aria-label*="Enter"]',
      ]

      let input = null
      for (const sel of inputSelectors) {
        input = await page.$(sel)
        if (input) break
      }

      if (!input) {
        console.error('  Could not find input field! Taking debug screenshot...')
        await page.screenshot({ path: path.join(OUTPUT_DIR, `debug_${i}.png`) })
        continue
      }

      // Type the prompt
      const imagePrompt = `Generate an image: ${prompt}. Variation ${i} of ${count}, make each unique.`
      await input.click()
      await page.waitForTimeout(500)

      // Clear any existing text
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Backspace')
      await page.waitForTimeout(200)

      await input.fill(imagePrompt)
      await page.waitForTimeout(500)

      // Submit - try Enter key
      await page.keyboard.press('Enter')
      console.log('  Prompt sent, waiting for image generation...')

      // Wait for image to appear in response
      // Gemini generates images and shows them as <img> elements
      try {
        // Wait for response to complete (loading indicator disappears)
        await page.waitForTimeout(5000) // initial wait

        // Wait for an image to appear in the latest response
        let imageFound = false
        for (let attempt = 0; attempt < 30; attempt++) {
          // Check for images in the response area
          const images = await page.$$('img[src*="blob:"], img[src*="data:image"], img[src*="lh3.google"], img[src*="generated"], .response-container img, .model-response img')

          // Also check for any new images that appeared
          const allImages = await page.$$('img')
          const candidateImages = []
          for (const img of allImages) {
            const src = await img.getAttribute('src').catch(() => '')
            const width = await img.evaluate(el => el.naturalWidth).catch(() => 0)
            if (width > 200 && src && !src.includes('avatar') && !src.includes('icon') && !src.includes('logo')) {
              candidateImages.push(img)
            }
          }

          if (candidateImages.length > 0) {
            // Take the last large image (most likely the generated one)
            const targetImg = candidateImages[candidateImages.length - 1]
            const filename = `${baseName}_gemini_${i}`
            const outputPath = path.join(OUTPUT_DIR, `${filename}.png`)
            const saved = await downloadImage(page, targetImg, outputPath)
            console.log(`  Saved: ${saved}`)
            results.push(path.basename(saved))
            imageFound = true
            break
          }

          // Check if still generating (look for loading indicators)
          const isLoading = await page.$('.loading, .thinking, [aria-busy="true"], .generating')
          if (!isLoading && attempt > 10) {
            console.log('  No loading indicator and no image found after waiting...')
            break
          }

          await page.waitForTimeout(2000)
          if (attempt % 5 === 0) console.log(`  Still waiting... (${attempt * 2}s)`)
        }

        if (!imageFound) {
          console.log('  No image detected. Taking screenshot for review...')
          await page.screenshot({ path: path.join(OUTPUT_DIR, `debug_response_${i}.png`), fullPage: true })
        }
      } catch (err) {
        console.error(`  Error waiting for response: ${err.message}`)
        await page.screenshot({ path: path.join(OUTPUT_DIR, `debug_error_${i}.png`) })
      }

      // Start new chat for next image to avoid context
      if (i < count) {
        console.log('  Starting new chat...')
        await page.goto('https://gemini.google.com/app', { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(3000)
      }
    }
  } finally {
    console.log('\nClosing browser...')
    await context.close()
  }

  console.log(`\nDone! Generated ${results.length}/${count} portraits.`)
  if (results.length > 0) console.log(`Files in: ${OUTPUT_DIR}`)
  return results
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: node scripts/gemini-browser-gen.mjs <character_name> [count=4]')
    console.log('       node scripts/gemini-browser-gen.mjs --prompt "custom prompt" [count=4]')
    console.log('       node scripts/gemini-browser-gen.mjs --list')
    console.log('\nIMPORTANT: Close Chrome before running!')
    process.exit(0)
  }

  if (args[0] === '--list') {
    const chars = await fetchCharacters()
    for (const c of chars) console.log(`  ${c.name || c.backstory?.name || 'unnamed'} (${c.id})`)
    return
  }

  let prompt, baseName, count = 4

  if (args[0] === '--prompt') {
    prompt = args[1]
    baseName = 'custom'
    count = parseInt(args[2]) || 4
  } else {
    const charName = args[0]
    count = parseInt(args[1]) || 4

    console.log(`Fetching character "${charName}"...`)
    const chars = await fetchCharacters()
    const char = findCharacter(chars, charName)

    if (!char) {
      console.error(`Character "${charName}" not found.`)
      for (const c of chars) console.log(`  ${c.name || c.backstory?.name}`)
      process.exit(1)
    }

    console.log(`Found: ${char.name || char.backstory?.name}`)
    prompt = generatePortraitPrompt(char)
    baseName = (char.name || char.backstory?.name || 'char')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '')
  }

  console.log(`\nPrompt: ${prompt}\n`)
  await generateViaGeminiChat(prompt, baseName, count)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
