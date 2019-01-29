var express = require('express')
var fortune = require('./lib/fortune.js')
var weather = require('./lib/weather.js')

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

app.use((req, res, next) => {
  if (!res.locals.partials) {
    res.locals.partials = {}
  }
  res.locals.partials.weather = weather.getWeatherData()
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