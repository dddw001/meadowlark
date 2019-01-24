var express = require('express')
var fortune = require('./lib/fortune.js')

var app = express()

app.set('port', process.env.PORT || 3000)
// 设置模板引擎
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'})
app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')

// 设置静态资源目录
app.use(express.static(__dirname + '/public'))

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