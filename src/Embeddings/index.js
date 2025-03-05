/**
 * OpenAI Embeddings Generator
 * 
 * This script processes fruit data from a CSV file and generates OpenAI embeddings for each text entry.
 * The resulting embeddings are saved to a new CSV file for further processing or analysis.
 */

import OpenAI from "openai"
import fs from "fs"
import csvParser from "csv-parser"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generateEmbeddings(text) {
  try {
    // Call OpenAI API to create embeddings
    const res = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    })
    // Return just the embedding array from the response
    return res.data[0].embedding
  }
  catch (error) {
    throw error
  }
}

async function processCSV(inputFile, outputFile) {
  const rows = []

  await new Promise((resolve, reject) => {
    // Create read stream for the CSV file
    fs.createReadStream(inputFile)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        try {
          // Generate embeddings for each row's text content
          for (const row of rows) {
            row['ada_embedding'] = await generateEmbeddings(row.text)
          }

          // Convert the data to CSV format
          const csvData = [
            Object.keys(rows[0]).join(","), // Header row
            ...rows.map(row => Object.values(row).join(",")) // Data rows
          ].join('\n')

          // Write the CSV data to the output file
          fs.writeFileSync(outputFile, csvData)
          resolve(csvData)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

// Define file paths
const inputFilePath = path.join(__dirname, 'fruit_data.csv')
const outputFilePath = path.join(__dirname, 'result.csv')

// Execute the processing
processCSV(inputFilePath, outputFilePath)
  .then(() => console.log('Processing complete'))
  .catch(error => console.error('Error during processing:', error));