/**
 * Build and seed a new database.
 * @module data/seed
 */
const fs = require('fs')

const csv = require('csvdata')

const database = require('../lib/database')
const sitter = require('../lib/sitter')

/**
 * Seed the database.  Ensure that your configured database exists before running.
 */
async function seed () {
  const db = await database.getConnection()
  await loadSchema(db)
  await loadData(db)
  db.release()
  database.closePool()
}

/**
 * Read the schema file into the configured database.
 * @param {DatabaseConnection} db - The database connection.
 */
async function loadSchema (db) {
  console.log('Loading schema')
  const queries = fs.readFileSync(`${__dirname}/schema.sql`, 'utf8')
    .split(';')
    .map(s => s.trim())
    .filter(s => s)
  for (var q of queries) {
    await db.query(q)
  }
}

/**
 * Read and parse the backup reviews, creating user records for owners and sitters,
 * and update the sitter ranks.
 * @param {DatabaseConnection} db - The database connection.
 */
async function loadData (db) {
  console.log('Loading data')
  const reviews = await csv.load(`${__dirname}/reviews.csv`)
  const owners = {}
  const sitters = {}
  for (var r of reviews) {
    const ownerId = /(\d+)$/.exec(r.owner_image)[1]
    if (!owners[ownerId]) {
      owners[ownerId] = true
      await db.query(`
        INSERT user
               (id, name, email, phone, image, owner, sitter)
        VALUES (?, ?, ?, ?, ?, 1, 0)
      `, [ ownerId, r.owner, r.owner_email, r.owner_phone_number, r.owner_image ])
    }
    const sitterId = /(\d+)$/.exec(r.sitter_image)[1]
    if (!sitters[sitterId]) {
      sitters[sitterId] = {
        name: r.sitter,
        ratings: []
      }
      await db.query(`
        INSERT user 
               (id, name, email, phone, image, owner, sitter)
        VALUES (?, ?, ?, ?, ?, 0, 1)
      `, [ sitterId, r.sitter, r.sitter_email, r.sitter_phone_number, r.sitter_image ])
    }
    sitters[sitterId].ratings.push(r.rating)
    await db.query(`
      INSERT stay
             (ownerId, sitterId, dogs, start, end, text, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [ ownerId, sitterId, r.dogs, r.start_date, r.end_date, r.text, r.rating ])
  }
  for (var id in sitters) {
    const rank = await sitter.calculateRank(sitters[id].name, sitters[id].ratings)
    await db.query('UPDATE user SET rank = ? WHERE id = ?', [ rank, id ])
  }
}

seed()
