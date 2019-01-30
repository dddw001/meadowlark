var nodemailer = require('nodemailer')
module.exports = function(credentials) {
  var mailTransport = nodemailer.createTransport({
    service: 'qq',
    port: 465,
    secureConnection: true,
    auth: {
      user: credentials.email.user,
      pass: credentials.email.password
    }
  })
  return {
    send: function (to, subj, body) {
      var mailOptions = {
        from: credentials.email.user,
        to: to,
        subject: subj,
        html: body,
        generateTextFromHtml: true
      }
      mailTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error)
        }
        console.log(info.messageId)
      })
    },
    emailError: function (message, filename, exception) {
      var body = '<h1>Meadowlark Travel Site Error</h1>' + 'message:<br><pre>' + message + '</pre><br>'
      if (exception) {
        body += 'exception:<br><pre>' + exception + '</pre><br>'
      }
      if (filename) {
        body += 'filename:<br><pre>' + filename + '</pre><br>'
      }
      var mailOptions = {
        from: credentials.email.user,
        to: credentials.email.user,
        subject: 'Meadowlark Travel Site Error',
        html: body,
        generateTextFromHtml: true
      }
      mailTransport.sendMail(mailOptions, (error) => {
        if (error) {
          return console.log(error)
        }
      })
    }
  }
}