const sitter = require('../lib/sitter')

module.exports = async function sitters (ctx, next) {
  ctx.body = JSON.stringify(await sitter.list(ctx.query))
  await next()
}
