exports.notify = (req, res) => {
  res.render('notify-me-when-in-season', { sku: req.query.sku })
}