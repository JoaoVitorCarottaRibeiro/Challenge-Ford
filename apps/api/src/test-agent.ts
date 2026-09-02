import * as dotenv from 'dotenv'
dotenv.config()

import axios from 'axios'

async function testSearch() {
  const query = 'Toyota Hilux GR Sport 2025 ficha técnica'
  const encoded = encodeURIComponent(query)
  const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`

  const res = await axios.get(url, { timeout: 10000 })
  console.log('AbstractText:', res.data.AbstractText)
  console.log('RelatedTopics:', res.data.RelatedTopics?.slice(0, 3))
  console.log('Results:', res.data.Results?.slice(0, 3))
}

async function testFetch() {
  const url = 'https://www.toyota.com.br/modelos/hilux-cabine-dupla'
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FordPickupIntel/1.0)' },
    timeout: 15000
  })
  const html = String(res.data)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000)

  console.log('Conteúdo Toyota:', text)
}

async function testFetch2() {
  const url = 'https://www.icarros.com.br/toyota/hilux/versoes/14571'
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FordPickupIntel/1.0)' },
    timeout: 15000
  })
  const html = String(res.data)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 1000)

  console.log('iCarros:', text)
}

testSearch().then(() => testFetch()).then(() => testFetch2()).catch(console.error)

