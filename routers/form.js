exports.newsLetter = (req, res) => {
  res.render('news-letter', {csrf: 'CSRF token goes here'})
}

exports.newsLetterAjax = (req, res) => {
  res.render('news-letter-ajax', {csrf: 'CSRF token goes here'})
}

exports.vacationPhoto = (req, res) => {
  const now = new Date()
  res.render('contest/vacation-photo', {
    year: now.getFullYear(),
    month: now.getMonth()
  })
}