var express = require('express')
var fortune = require('./lib/fortune.js')
var weather = require('./lib/weather.js')
var formidable = require('formidable')
var credentials = require('./lib/credentials')

var app = express()
app.set('x-powered-by', false)

app.set('port', process.env.PORT || 3000)
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

app.use((req, res, next) => {
  if (!res.locals.partials) {
    res.locals.partials = {}
  }
  res.locals.partials.weather = weather.getWeatherData()

  res.locals.flash = req.session.flash
  delete req.session.flash

  next()
})

// 首页
app.get('/', function(req, res){
  // res.type('text/plain')
  // res.send('Meadowlark Travel')
  res.render('home')
})

// about页
app.get('/about', function(req, res){
  res.render('about', {fortune: fortune.getFortune()})
})

// 先渲染视图，再渲染布局
app.get('/foo', (req, res) => {
  res.render('foo', {layout: null})
})

app.get('/jquery-test', (req, res) => {
  res.render('jquery-test')
})

// 在视图中使用hbs jquery 渲染页面
app.get('/nursery-rhyme', (req, res) => {
  res.render('nursery-rhyme')
})

app.get('/data/nursery-rhyme', (req, res) => {
  res.json({
    animal: 'squirrel',
    bodyPart: 'tail',
    adjective: 'bushy',
    noun: 'heck'
  })
})

// 提交表单
app.get('/news-letter', function(req, res){
  res.render('news-letter', {csrf: 'CSRF token goes here'})
})
app.post('/process', function(req, res){
  console.log('Form (from querystring): ' + req.query.form)
  console.log('CSRF token (from hidden form field): ' + req.body._csrf)
  console.log('Name (from visible form field): ' + req.body.name)
  console.log('Email (from visible form field): ' + req.body.email)
  res.redirect(303, '/thank')
})
app.get('/thank', function(req, res){
  res.send('Thank You')
})

// ajax处理表单
app.get('/news-letter-ajax', function(req, res){
  res.render('news-letter-ajax', {csrf: 'CSRF token goes here'})
})

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
app.get('/contest/vacation-photo',function(req,res){
  var now = new Date()
  res.render('contest/vacation-photo',{
    year: now.getFullYear(),
    month: now.getMonth()
  })
})
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

// 404页面
app.use(function(req, res){
  res.status(404)
  res.render('404')
})

//505页面
app.use(function(err, req, res, next){
  console.error(err.stack)
  res.status(500)
  res.render('500')
})

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' +
    app.get('port') + ';press Ctrl-C to terminate')
})