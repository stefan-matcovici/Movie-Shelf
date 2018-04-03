let express = require('express');
let router = express.Router();
let passport = require('passport');
let request = require('request');
const images = require('../lib/images');

const TOPICS = ["comedy", "sci-fi", "horror", "romance", "action", "thriller", "drama", "crime", "mystery", "adventure"];

const sendEmailFunctionUrl = "https://us-central1-movie-shelf.cloudfunctions.net/sendEmail";

function getMovieModel() {
    return require(`../models/movie-model-${require('../config').get('DATA_BACKEND')}.js`);

}

function getUserModel() {
    return require(`../models/user-model-${require('../config').get('DATA_BACKEND')}.js`);
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { message: req.flash('loginMessage') });
});

router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/movies',
        failureRedirect: '/',
        failureFlash: true
    })
);

router.get('/subscribe', isLoggedIn, function (req, res) {
    let subscribedTopics = req.user.topics;
    let unsubscribedTopics = TOPICS.filter(function (i) {
        return subscribedTopics.indexOf(i) < 0;
    });
    console.log(unsubscribedTopics);
    res.render('subscribe', {subscribedTopics: subscribedTopics, topics: TOPICS});
});


router.post('/subscribe', isLoggedIn, function (req, res) {
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

router.get('/movies', isLoggedIn, function(req, res, next) {
    getMovieModel().list(10, req.query.pageToken, (err, entities, cursor) => {
        if (err) {
            next(err);
            return;
        }

        res.render('movies/list', {
            movies: entities,
            nextPageToken: cursor
        });
    });
});

router.get('/add-movie', isLoggedIn, function(req, res, next) {
    res.render('movies/add', {topics: TOPICS});
});


router.post(
    '/add-movie',
    isLoggedIn,
    images.multer.single('image'),
    images.sendUploadToGCS,
    (req, res, next) => {
        let data = req.body;

        data.topics = JSON.parse(data.topics);
        console.log(data);

        // Was an image uploaded? If so, we'll use its public URL
        // in cloud storage.
        if (req.file && req.file.cloudStoragePublicUrl) {
            data.imageUrl = req.file.cloudStoragePublicUrl;
        }

        // Save the data to the database.
        getMovieModel().create(data, (err, savedData) => {
            if (err) {
                next(err);
                return;
            }


            for (var i=0;i<data.topics.length;i++){
                topic = data.topics[i];
                getUserModel().getSubscribed(topic, (err, users) => {
                    if (err) {
                        next(err);
                        return;
                    }

                    console.log(users);

                    let payload = {
                        to: users.map(user => {return user.username;}),
                        from: req.user.username,
                        subject: "Subject",
                        body: "Look! A new movie in topic " + topic + " was added!"
                    };

                    let options = {
                        method: 'post',
                    };

                    console.log(payload);

                    request.post({
                        body: payload,
                        json: true,
                        url: sendEmailFunctionUrl
                    }, function(error, response, body){
                        console.log(body);
                    });
                });
            }

            res.redirect(`${req.baseUrl}/movies`);
        });
    }
);

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}


module.exports = router;
