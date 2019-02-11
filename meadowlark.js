var express = require('express')
var fortune = require('./lib/fortune.js')
var weather = require('./lib/weather.js')
var formidable = require('formidable')
var credentials = require('./lib/credentials')
var mongoose = require('mongoose')
var Vacation = require('./models/vacation.js')
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js')

var session = require('express-session')
var MongoSessionStore = require('connect-mongo')(session)

var app = express()
app.set('x-powered-by', false)
app.set('port', process.env.PORT || 3000)

switch (app.get('env')) {
  case 'development':
    mongoose.connect(credentials.mongo.development.connectionString)
    break
  case 'production':
    mongoose.connect(credentials.mongo.production.connectionString)
    break
  default:
    throw new Error('Unknown execution environment:' + app.get('env'))
}
var db = mongoose.connection
db.on('open', function(err){
  if (err) {
    console.log('数据库连接失败')
    throw err
  }
  console.log('数据库连接成功')
})

var sessionStore = new MongoSessionStore({
  mongooseConnection: db,
  ttl: 7*24*60*60
})
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: credentials.cookieSecret,
  store: sessionStore
}))

Vacation.find(function(err, vacations){
  if(vacations.length) return
  new Vacation({
    name: 'Hood River Day Trip',
    slug: 'hood-river-day-trip',
    category: 'Day Trip',
    sku: 'HR199',
    description: 'Spend a day sailing on the Columbia and ' + 'enjoying craft beers in Hood River!',
    priceInCents: 9995,
    tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
    inSeason: true,
    maximumGuests: 16,
    available: true,
    packagesSold: 0
  }).save()
  new Vacation({
    name: 'Oregon Coast Getaway',
    slug: 'oregon-coast-getaway',
    category: 'Weekend Getaway',
    sku: 'OC39',
    description: 'Enjoy the ocean air and quaint coastal towns!',
    priceInCents: 269995,
    tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
    inSeason: false,
    maximumGuests: 8,
    available: true,
    packagesSold: 0
  }).save()
  new Vacation({
    name: 'Rock Climbing in Bend',
    slug: 'rock-climbing-in-bend',
    category: 'Adventure',
    sku: 'B99',
    description: 'Experience the thrill of climbing in the high desert.',
    priceInCents: 289995,
    tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing'],
    inSeason: true,
    requiresWaiver: true,
    maximumGuests: 4,
    available: false,
    packagesSold: 0,
    notes: 'The tour guide is currently recovering from a skiing accident.'
  }).save()
})

// 发送邮件
// var emailService = require('./lib/email.js')(credentials)
// emailService.send('2398516225@qq.com', 'Hi', 'Hello World')

// 设置模板引擎
var handlebars = require('express3-handlebars').create({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    section: function (name, options) {
      if (!this._sections) {
        this._sections = {}
      }
      this._sections[name] = options.fn(this)
      return null
    }
  }
})
app.engine('hbs', handlebars.engine)
app.set('view engine', 'hbs')

// 设置静态资源目录
app.use(express.static(__dirname + '/public'))

app.use(require('body-parser').urlencoded({extended: false}))
app.use(require('cookie-parser')(credentials.cookieSecret))
app.use(require('express-session')())

// 以api开头的API可跨域
app.use('/api', require('cors')())

// 设置locals数据
app.use((req, res, next) => {
  if (!res.locals.partials) {
    res.locals.partials = {}
  }
  res.locals.partials.weather = weather.getWeatherData()

  res.locals.flash = req.session.flash
  delete req.session.flash

  next()
})

// ajax请求
app.get('/data/nursery-rhyme', (req, res) => {
  res.json({
    animal: 'squirrel',
    bodyPart: 'tail',
    adjective: 'bushy',
    noun: 'heck'
  })
})

// 提交表单
app.post('/process', function(req, res){
  console.log('Form (from querystring): ' + req.query.form)
  console.log('CSRF token (from hidden form field): ' + req.body._csrf)
  console.log('Name (from visible form field): ' + req.body.name)
  console.log('Email (from visible form field): ' + req.body.email)
  res.redirect(303, '/thank')
})

// ajax处理表单
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb()
}
var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
app.post('/process2', function(req, res){
  var name = req.body.name || ''
  var email = req.body.email || ''
  // 输入验证
  if(!email.match(VALID_EMAIL_REGEX)) {
    if(req.xhr) {
      return res.json({ error: 'Invalid name email address.' })
    }
    req.session.flash = {
      message: 'The email address you entered was not valid.'
    }
    return res.redirect(303, '/')
  }
  new NewsletterSignup({ name: name, email: email }).save(function(err){
    if(err) {
      if(req.xhr) {
        return res.json({ error: 'Database error.' })
      }
      req.session.flash = {
        message: 'There was a database error; please try again later.'
      }
      return res.redirect(303, '/')
    }
    if (req.xhr || req.accepts('json, html') === 'json') {
      res.send({success: true})
    } else {
      res.redirect(303, '/')
    }
  })
})

// 上传文件
app.post('/contest/vacation-photo/:year/:month', function(req, res){
  var form = new formidable.IncomingForm()
  form.parse(req, function(err, fields, files){
    if(err) return res.redirect(303, '/error')
    console.log('received fields:')
    console.log(fields)
    console.log('received files:')
    console.log(files)
    res.redirect(303, '/thank')
  })
})

// 插入数据
app.post('/notify-me-when-in-season', function(req, res){
  VacationInSeasonListener.updateOne(
    { email: req.body.email },
    { $push: { skus: req.body.sku } },
    { upsert: true },
    function(err){
      if(err) {
        console.error(err.stack)
        req.session.flash = {
          type: 'danger',
          intro: 'Ooops!',
          message: 'There was an error processing your request.'
        }
        return res.redirect(303, '/vacations')
      }
      req.session.flash = {
        type: 'success',
        intro: 'Thank you!',
        message: 'You will be notified when this vacation is in season.'
      }
      return res.redirect(303, '/vacations')
    }
  )
})

// mongodb存储session
app.get('/set-currency/:currency', (req, res) => {
  if (!req.session) {
    req.session = {}
  }
  req.session.currency = req.params.currency
  return res.redirect(303, '/vacations')
})
function convertFromUSD(value, currency){
  switch (currency) {
    case 'USD': return value * 1
    case 'GBP': return value * 0.6
    case 'BTC': return value * 0.0023707918444761
    default: return NaN
  }
}
app.get('/vacations', function (req, res) {
  Vacation.find({ available: true }, function (err, vacations) {
    var currency = req.session.currency || 'USD'
    var context = {
      currency: currency,
      vacations: vacations.map(function (vacation) {
                  return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: convertFromUSD(vacation.priceInCents/100, currency),
                    qty: vacation.qty,
                  }
                })
    }
    switch (currency) {
      case 'USD': context.currencyUSD = 'selected'
                  break
      case 'GBP': context.currencyGBP = 'selected'
                  break
      case 'BTC': context.currencyBTC = 'selected'
                  break
    }
    res.render('vacations', context)
  })
})

// 路由
const routers = require('./routers/index.js')(app)
// 自动化渲染 添加.hbs视图就有了对应的路由
let autoViews = {}
const fs = require('fs')
app.use(function(req,res,next){
  const path = req.path.toLowerCase()
  // 检查缓存；如果它在那里，渲染这个视图
  if (autoViews[path]) {
    return res.render(autoViews[path])
  }
  // 如果它不在缓存里，那就看看有没有 .hbs 文件能匹配
  if (fs.existsSync(__dirname + '/views' + path + '.hbs')) {
    autoViews[path] = path.replace(/^\//, '')
    return res.render(autoViews[path])
  }
  // 没发现视图；转到 404 处理器
  next()
})

var Rest = require('connect-rest')
var connect = require('connect')
var bodyParser = require('body-parser')
var connectApp = connect().use(bodyParser.urlencoded({extended: true}))
  .use(bodyParser.json())
var options = {
  context: '/api',
  domain: require('domain').create()
}
var rest = Rest.create(options)
connectApp.use(rest.processRequest())
// 景点的增删改查
var Attraction = require('./models/attraction.js')
rest.get('/attractions', function (req, content, cb) {
  Attraction.find({ approved: true }, function (err, attractions) {
    if (err) {
      return cb({ error: 'Internal error.' })
    }
    cb(null, attractions.map(function (a) {
      return {
        name: a.name,
        description: a.description,
        location: a.location
      }
    }))
  })
})
rest.post('/attraction', function (req, content, cb) {
  var a = new Attraction({
    name: req.body.name,
    description: req.body.description,
    location: { lat: req.body.lat, lng: req.body.lng },
    history: {
      event: 'created',
      email: req.body.email,
      date: new Date()
    },
    approved: false
  })
  a.save(function (err, a) {
    if (err) {
      return cb({ error: 'Unable to add attraction.' })
    }
    cb(null, { id: a._id })
  })
})
rest.get('/attraction/:id', function(req, content, cb){
  Attraction.findById(req.params.id, function(err, a){
    if (err) {
      return cb({ error: 'Unable to retrieve attraction.' })
    }
    cb(null, {
      name: attraction.name,
      description: attraction.description,
      location: attraction.location
    })
  })
})

// 404页面
app.use(function(req, res){
  res.status(404)
  res.render('404')
})

//500页面
app.use(function(err, req, res, next){
  console.error(err.stack)
  res.status(500)
  res.render('500')
})

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' +
    app.get('port') + ';press Ctrl-C to terminate')
})