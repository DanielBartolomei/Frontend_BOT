var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/home', function(req, res, next) {
  res.render('index', { title: 'Giraff Cobot - Home' });
});

router.get('/navigation', function(req, res, next) {
  res.render('navigation', { title: 'Giraff Cobot - Home' });
});

router.get('/settings', function(req, res, next) {
  res.render('settings', { title: 'Giraff Cobot - Home' });
});

module.exports = router;
