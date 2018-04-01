// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const Datastore = require('@google-cloud/datastore');
const config = require('../config');

// [START config]
const ds = Datastore({
    projectId: config.get('GCLOUD_PROJECT')
});
const movieKind = 'Movie';

function fromDatastore(obj) {
    obj.id = obj[Datastore.KEY].id;
    return obj;
}

function toDatastore(obj, nonIndexed) {
    nonIndexed = nonIndexed || [];
    const results = [];
    Object.keys(obj).forEach((k) => {
        if (obj[k] === undefined) {
            return;
        }
        results.push({
            name: k,
            value: obj[k],
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1
        });
    });
    return results;
}

function list (limit, token, cb) {
    const q = ds.createQuery([movieKind])
        .limit(limit)
        .order('year')
        .start(token);

    ds.runQuery(q, (err, entities, nextQuery) => {
        if (err) {
            cb(err);
            return;
        }
        const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
        cb(null, entities.map(fromDatastore), hasMore);
    });
}

function update(id, data, cb) {
    let key;
    if (id) {
        key = ds.key([movieKind, parseInt(id, 10)]);
    } else {
        key = ds.key(movieKind);
    }

    const entity = {
        key: key,
        data: toDatastore(data, ['description'])
    };

    ds.save(
        entity,
        (err) => {
            data.id = entity.key.id;
            cb(err, err ? null : data);
        }
    );
}

function create(data, cb) {
    update(null, data, cb);
}

function read(id, cb) {
    const key = ds.key([movieKind, parseInt(id, 10)]);
    ds.get(key, (err, entity) => {
        if (!err && !entity) {
            err = {
                code: 404,
                message: 'Not found'
            };
        }
        if (err) {
            cb(err);
            return;
        }
        cb(null, fromDatastore(entity));
    });
}

function _delete(id, cb) {
    const key = ds.key([movieKind, parseInt(id, 10)]);
    ds.delete(key, cb);
}

function get(data, cb) {
    const loginQuery = ds
        .createQuery('User')
        .filter('username', '=', data.username)
        .filter('password', '=', data.password);

    ds.runQuery(loginQuery).then(results => {
        // console.log(results);
        const users = results[0];

        if (users.length === 0) {
            cb({
                code: 404,
                message: 'Not found'
            });
            return;
        }
        cb(null, fromDatastore(users[0]));
    }).catch(err => {
        cb(err);
    });
}

module.exports = {
    create,
    read,
    update,
    delete: _delete,
    list,
    get
};