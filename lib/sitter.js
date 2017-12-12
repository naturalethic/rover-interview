/**
 * Interface to sitters data.
 * @module lib/sitter
 */

const Ajv = require('ajv')

const database = require('./database')

const ajv = new Ajv({ useDefaults: true, coerceTypes: true })

/**
 * Calculate a ratings score.
 * @param {Integer[]} ratings - An array of ratings.
 * @returns {Number} - The ratings score.
 */
const calculateRatingsScore = exports.calculateRatingsScore = (ratings) => {
  if (!ajv.validate({
    type: 'array',
    items: { type: 'integer' }
  }, ratings)) throw new Error('ValidationError')
  return ratings.reduce((m, n) => n + m) / ratings.length
}

/**
 * Calculate a sitter score.
 * @param {String} name - The sitter name.
 * @returns {Number} - The sitter score
 */
const calculateSitterScore = exports.calculateSitterScore = (name) => {
  if (!ajv.validate({
    type: 'string'
  }, name)) throw new Error('ValidationError')
  // XXX: Assess performance
  const w = Object.keys(
    name.toLowerCase()
      .split('')
      .filter(c => /[a-z]/.test(c))
      .reduce((m, c) => { m[c] = true; return m }, {})
    ).length
  return (w / 26) * 5
}

/**
 * Calculate the overall sitter rank.  The calculation uses a baseline of the sitter score,
 * and draws a flat curve up or down to the ratings score up to the first ten stays.
 * @param {String} name - The sitter name.
 * @param {Integer[]} ratings - The review ratings.
 * @returns {Number} The overall sitter rank.
 */
exports.calculateRank = async (name, ratings) => {
  const ss = calculateSitterScore(name)
  const rs = calculateRatingsScore(ratings)
  return ss + (0.10 * (Math.min(ratings.length, 10)) * (rs - ss))
}

/**
 * @typedef {Object} SitterListResult
 * @property {Object[]} sitters - A list of sitters.
 * @property {Integer} pageCount - The number of pages for the page size.
 */

/**
 * Provide a list of sitters.
 * @param {Object} params - Argument parameters.
 * @param {Number} [params.minRank=0] - The minimum overall sitter rank.
 * @param {Integer} [params.pageNumber=1] - The 1-indexed page number.
 * @param {Integer} [params.pageSize=10] - The number of results per page.
 * @param {String} [params.sortBy=owner] - The field to sort by
 * @param {Boolean} [params.sortReverse=false] - Sort in reverse order.
 * @returns {SitterListResult} A list of sitters.
 */
exports.list = async (params = {}) => {
  // XXX: One would probably like to validate certain min/max values for paging here.
  // XXX: One could also enumerate the valid column names for sorting.
  if (!ajv.validate({
    type: 'object',
    properties: {
      minRank: { type: 'number', default: 0 },
      pageNumber: { type: 'integer', default: 1 },
      pageSize: { type: 'integer', default: 10 },
      sortBy: { type: 'string', default: 'id' },
      sortReverse: { type: 'boolean', default: false }
    }
  }, params)) throw new Error('ValidationError')
  const db = await database.getConnection()
  try {
    const pageCount = (await db.query(`
      SELECT CAST(CEIL(COUNT(*) / ?) AS UNSIGNED) count
        FROM user
       WHERE sitter = 1
         AND rank >= ?
    `, [ params.pageSize, params.minRank ]))[0][0].count
    const sitters = (await db.query(`
        SELECT id, name, email, phone, image, rank
          FROM user
        WHERE sitter = 1
          AND rank >= ?
      ORDER BY ?? ${params.sortReverse ? 'DESC' : 'ASC'}
        LIMIT ${params.pageSize} OFFSET ${(params.pageNumber - 1) * params.pageSize}
    `, [ params.minRank, params.sortBy ]))[0]
    return { sitters, pageCount }
  } finally {
    db.release()
  }
}
