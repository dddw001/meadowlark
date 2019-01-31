const main = require('./main.js')
const section = require('./section.js')
const form = require('./form.js')
const mongodb = require('./mongodb.js')

module.exports = (app) => {
  app.get('/', main.home)
  app.get('/about', main.about)
  app.get('/thank', main.thank)
  app.get('/jquery-test', section.jqueryTest)
  app.get('/nursery-rhyme', section.nurseryRhyme)
  app.get('/news-letter', form.newsLetter)
  app.get('/news-letter-ajax', form.newsLetterAjax)
  app.get('/contest/vacation-photo', form.vacationPhoto)
  app.get('/notify-me-when-in-season', mongodb.notify)
}