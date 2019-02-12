var Q = require('q')
var credentials = require('./credentials.js')
var http = require('http')
exports.getWeatherData = (() => {
  // 天气缓存
  var c = {
    refreshed: 0,
    refreshing: false,
    updateFrequency: 360000, // 1 小时
    locations: [
      { name: '101010100' }, // 北京
      { name: '101020100' }, // 上海
      { name: '101280101' } // 广州
    ]
  }
  return function() {
    if( !c.refreshing && Date.now() > c.refreshed + c.updateFrequency ){
      c.refreshing = true
      var promises = []
      c.locations.forEach(function(loc){
        var deferred = Q.defer()
        var url = 'http://api.weatherdt.com/common/?area=' + loc.name +
          '&type=forecast&key=' + credentials.weatherdt.apiKey
        http.get(url, function(res){
          var body = ''
          res.on('data', function(chunk){
            body += chunk
          })
          res.on('end', function(){
            body = JSON.parse(body)
            loc.forecastUrl = 'http://www.weatherdt.com/help.html'
            loc.weather = body.forecast['24h'][loc.name]['1001001'][0]['001']
            loc.temp = body.forecast['24h'][loc.name]['1001001'][0]['003']
            deferred.resolve()
          })
        })
        promises.push(deferred)
      })
      Q.all(promises).then(function(){
        c.refreshing = false
        c.refreshed = Date.now()
      })
    }
    //return { locations: c.locations }
    // 过多，不列举完
    const weatherArr = ['晴', '多云', '阴', '雨', '雪']
    c.locations.forEach((item, index) => {
      item.area = item.name === '101010100' ? '北京' : (item.name === '101020100' ? '上海' : '广州')
      item.temp = weatherArr[parseInt(item.weather) % 5]
    })
    return c.locations
  }
})()
// 初始化天气缓存
this.getWeatherData()