const Koa = require('koa')
const Router = require('koa-router')
const logger = require('koa-logger')
const cors = require('koa2-cors')

const config = require('../server.config')

const app = new Koa()
const router = new Router()

router.get('/sitters', require('./sitters'))

app.use(logger())
app.use(cors())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(config.api.port)

console.log(`Api listening on port ${config.api.port}`)
