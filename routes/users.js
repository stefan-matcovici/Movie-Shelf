let express = require('express');
let router = express.Router();
let passport = require('passport');

router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/loginSuccess',
        failureRedirect: '/login',
        failureFlash : true
    })
);

router.get('/login', (req, res) => {
    res.render('login', { message: req.flash('loginMessage') });
});

router.get('/loginFailure', function(req, res, next) {
    res.send('Failed to authenticate');
});

router.get('/loginSuccess', function(req, res, next) {
    res.send('Successfully authenticated');
});

router.get('/protectedResource', isLoggedIn, function(req, res) {
    res.send("You are cool");
});

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}

module.exports = router;
