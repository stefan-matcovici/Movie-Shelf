let express = require('express');
let router = express.Router();
let passport = require('passport');

router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/loginSuccess',
        failureRedirect: '/loginFailure'
    })
);

router.get('/login', (req, res) => {
    res.render('login', {
        user: {},
        action: 'login'
    });
});

module.exports = router;
