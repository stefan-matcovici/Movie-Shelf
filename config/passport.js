let LocalStrategy = require('passport-local').Strategy;

function getModel() {
    return require(`../models/model-${require('../config').get('DATA_BACKEND')}.js`);
}

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        getModel().read(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local', new LocalStrategy({
            passReqToCallback: true
        },
        function (req, username, password, done) {

            let userCredentials = {username: username, password: password};

            getModel().get(userCredentials, (err, entity) => {
                if (err) {
                    return done(null, false, req.flash('loginMessage', 'Invalid credentials'));
                }

                return done(null, entity);
            });
        }));

};