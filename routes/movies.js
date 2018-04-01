let express = require('express');
let router = express.Router();
const images = require('../lib/images');

function getMovieModel() {
    return require(`../models/movie-model-${require('../config').get('DATA_BACKEND')}.js`);
}

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


router.post(
    '/add',
    images.multer.single('image'),
    images.sendUploadToGCS,
    (req, res, next) => {
        let data = req.body;

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
