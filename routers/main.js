var fortune = require('../lib/fortune.js')

exports.home = (req, res) => {
  res.render('home')
}

exports.about = (req, res) => {
  res.render('about', {
    fortune: fortune.getFortune()
  })
}

exports.thank = (req, res) => {
  res.send('Thank You')
}