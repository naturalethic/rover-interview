/**
 * Database connection pool.
 * @module lib/database
 */

const mysql = require('mysql2/promise')

const config = require('../server.config')

const pool = mysql.createPool(config.database)

/**
 * Get a database connection from the pool.
 * @returns {DatabaseConnection} - The database connection.
 */
exports.getConnection = function () {
  return pool.getConnection()
}

/**
 * Close the connection pool.
 */
exports.closePool = function () {
  pool.end()
}
