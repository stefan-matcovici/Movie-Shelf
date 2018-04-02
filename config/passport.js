let LocalStrategy = require('passport-local').Strategy;

function getUserModel() {
    return require(`../models/user-model-${require('../config').get('DATA_BACKEND')}.js`);
}

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        getUserModel().read(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {

            let userCredentials = {username: username, password: password};

            getUserModel().get(userCredentials, (err, entity) => {
                if (err) {
                    console.log(err);
                    return done(null, false, req.flash('loginMessage', 'Invalid credentials'));
                }

                return done(null, entity);
            });
        }));

};