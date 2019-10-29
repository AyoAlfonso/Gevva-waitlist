const keys = require('../keys')

exports.loginForm = (req, res) => {
    res.render('user-login', {
        title: 'Login'
    });
};