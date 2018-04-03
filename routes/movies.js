let express = require('express');
let router = express.Router();
const images = require('../lib/images');

const TOPICS = ["comedy", "sci-fi", "horror", "romance", "action", "thriller", "drama", "crime", "mystery", "adventure"];

function getMovieModel() {
    return require(`../models/movie-model-${require('../config').get('DATA_BACKEND')}.js`);
}

router.get('/movies', function(req, res, next) {
    getMovieModel().list(10, req.query.pageToken, (err, entities, cursor) => {
        if (err) {
            next(err);
            return;
        }

        console.log(entities);

        res.render('movies/list', {
            movies: entities,
            nextPageToken: cursor
        });
    });
});

router.get('/add-movie', function(req, res, next) {
    res.render('movies/add', {topics: TOPICS});
});


router.post(
    '/add-movie',
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
            res.redirect(`${req.baseUrl}/${savedData.id}`);
        });
    }
);

router.get('/:movie', (req, res, next) => {
    console.log(req.params.movie);
    getMovieModel().read(req.params.movie, (err, entity) => {
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
