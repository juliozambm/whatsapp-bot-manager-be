const express = require('express')
const cors = require('cors')
const path = require('path')
const exceptionHandler = require('express-exception-handler')
exceptionHandler.handle()
const app = express()
const error = require('../api/middlewares/error')
const tokenCheck = require('../api/middlewares/tokenCheck')
const keyVerify = require('../api/middlewares/keyCheck')
const controller = require('../api/controllers/instance.controller')
const { protectRoutes } = require('./config')

app.use(cors())
app.use(express.json())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../api/views'))
global.WhatsAppInstances = {}

const routes = require('../api/routes/')

app.get('/instance/qr/', keyVerify, controller.qr)

if (protectRoutes) {
    app.use(tokenCheck)
}
app.use('/', routes)
app.use(error.handler)

module.exports = app
