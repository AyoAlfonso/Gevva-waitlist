'use strict';
let path = require('path');
let express = require('express');
let bodyParser = require('body-parser');
let logger = require('morgan');
let routes = require('./routes/index');
let cron = require('./cron/startJob');
let auth = require('./controller/auth');
let adminRoute = require('./routes/admin');
let session = require('express-session');
let app = express();

require('dotenv').config();

app.set('port', (process.env.PORT || 4500));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

/* Confirms Redirect http to https */
app.use('*', function (req, res, next) {
  let status = 302;
  if (req.headers['x-forwarded-proto'] != 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(status, 'https://' + req.hostname + req.originalUrl);
    return
  }
  else
    next()
});

app.use(express.static('public'))

  app.use(require('cookie-session')({
  secret: 'my cats name again',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false, // key
    maxAge: 24 * 60 * 60 * 1000 //Admin is only allowed to be able to log in at most for a day
  }
}))

/*
Initiate Cron Processes
cron.dripJob4();
cron.dripJob5();
//
*/

// cron.dripJobAfter14Days();
// cron.dripJobAfter18Days();
// cron.dripJob1();
// cron.dripJob2();
// cron.dripJob3();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

app.use('/', routes);
app.use('/admin', adminRoute)

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});