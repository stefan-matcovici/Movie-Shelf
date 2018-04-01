let express = require('express');
let router = express.Router();

function getMovieModel() {
    return require(`../models/movie-model-${require('../config').get('DATA_BACKEND')}.js`);
}

/* GET home page. */
router.get('/list', function(req, res, next) {
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

router.get('/add', function(req, res, next) {
    res.render('movies/add');
});

router.post('/add', (req, res, next) => {
    const data = req.body;

    getMovieModel().create(data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
});

router.get('/:book', (req, res, next) => {
    getMovieModel().read(req.params.book, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.render('movies/view.pug', {
            movie: entity
        });
    });
});


module.exports = router;
