let express = require('express');
let router = express.Router();
let passport = require('passport');

const TOPICS = ["comedy", "sci-fi", "horror", "romance", "action", "thriller", "drama", "crime", "mystery", "adventure"];

function getUserModel() {
    return require(`../models/user-model-${require('../config').get('DATA_BACKEND')}.js`);
}

router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/movies',
        failureRedirect: '/',
        failureFlash: true
    })
);

router.get('/login', (req, res) => {
    res.render('login', {message: req.flash('loginMessage')});
});

router.get('/loginFailure', function (req, res, next) {
    res.send('Failed to authenticate');
});

router.get('/loginSuccess', function (req, res, next) {
    res.send('Successfully authenticated');
});

router.get('/protectedResource', isLoggedIn, function (req, res) {
    res.send("You are cool");
});

router.get('/subscribe', function (req, res) {
    let subscribedTopics = req.user.topics;
    let unsubscribedTopics = TOPICS.filter(function (i) {
        return subscribedTopics.indexOf(i) < 0;
    });
    console.log(unsubscribedTopics);
    res.render('subscribe', {subscribedTopics: subscribedTopics, topics: TOPICS});
});

router.post('/subscribe', function (req, res) {
    let user = req.user;
    user.topics = req.body;

    getUserModel().update(user.id, user, (err, entity) => {
        if (err) {
            console.log(err);
            res.send(404);
        }

        res.send(entity);
    });
});


function isLoggedIn(req, res, next) {

    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}

module.exports = router;
