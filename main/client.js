'use strict';

const Request = require('request');
const Query = require('querystring');
const WebSocket = require('ws');


// Creates a Client object.
// - config: { clientId: String, clientSecret: String , token: String }

function Client(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.token = config.token;
};



// Performs a HTTP request.
// - parameters: { method: String, path: String, headers: JSON, body: JSON }
// - callback: function(Error, JSON)

function performRequest(parameters, callback) {
    if (!parameters.method) { parameters.method = 'GET'; }

    if (!parameters.path) {
        callback(new Error('Invalid parameters: must provide "path" value'));
        return;
    }

    var options = {
        method: parameters.method,
        uri: 'https://api.pnut.io/v0' + parameters.path
    };

    if (parameters.headers) { options.headers = parameters.headers; }
    if (parameters.body) { options.body = parameters.body; }

    return Request(options, function(err, res) {
        if (err) {
            callback(err, null);

        } else {
            var body = JSON.parse(res.body);

            if (body.meta && body.meta.error_message) {
                var error = new Error(body.meta.error_message);
                error.code = body.meta.code;
                callback(error);

            } else {
                callback(null, body);
            }
        }
    });
};



// Retrieves an App Access Token from pnut.io
// - parameters: { clientId: String, clientSecret: String }
// - callback: function(Error, Token)

function performAuthentication(parameters, callback) {
    if (!parameters.clientId || !parameters.clientSecret) {
        callback(new Error('Invalid configuration: Must supply both a clientId and clientSecret'));
        return;
    }

    var options = {
        method: 'POST',
        path: '/oauth/access_token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: Query.stringify({
            'client_id': parameters.clientId,
            'client_secret': parameters.clientSecret,
            'grant_type': 'client_credentials'
        })
    };

    performRequest(options, function(err, res) {
        if (err) {
            callback(err, null);

        } else {
            var token = res.access_token;

            if (token != null) {
                callback(null, token);
            } else {
                callback(new Error('Response did not include access token'), null);
            }
        }
    });
}



// Performs a authenticated HTTP request.
// An error is passed to the callback if `token` is null
// - parameters: { method: String, path: String, headers: JSON, body: JSON }
// - callback: function(error: Error, meta: JSON, data: JSON)

function performAuthenticatedRequest(token, parameters, callback) {
    if (!token) {
        callback(new Error('Unauthenticated: token must not be null'));
        return;
    }

    var options = {
        method: parameters.method,
        path: parameters.path,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    };

    if (parameters.headers) {
        parameters.headers.forEach(function(key) {
            options.headers[key] = parameters.headers[key];
        });
    }

    if (parameters.body) {
        options.body = JSON.stringify(parameters.body);
    }

    performRequest(options, function(err, res) {
        if (err) {
            callback(err);
        } else {
            callback(null, res.meta, res.data);
        }
    });
};


// Creates a WebSocket for the given url and calls the callback on events
// - url: String
// - callback: function(event: String, data: Object)

function monitorWebSocket(url, callback) {
    if (!url || !callback) {
        return console.error(new Error('Invalid parameters: must provide url and callback'));
    }

    var ws = new WebSocket(url);

    function enqueuePing() {
        if (ws.readyState === 1) {
            ws.send('something');

            setTimeout(function () {
                enqueuePing()
            }, 30 * 1000);
        }
    }

    ws.on('open', function open() {
        enqueuePing();
        callback('open', null);
    });

    ws.on('message', function incoming(data) {
        callback('message', JSON.parse(data));
    });

    ws.on('close', function closed(err) {
        callback('close', err);
    });
}


// Ensures keys exists in parameters
// - keys: Array<String>
// - parameters: Object

function ensureKeys(keys, parameters) {
    for (var index in keys) {
        var key = keys[index];

        if (parameters.hasOwnProperty(key) === false) {
            return new Error('Invalid parameters: must provide stream "' + key + '" value');
        }
    }

    return null;
}



// Authentication

Client.prototype.isAuthenticated = function() {
    return this.token != null;
};


// Authenticates the client object. Does not authenticate if a token already exists.
// - callback: function(error: Error)

Client.prototype.authenticate = function(callback) {
    if (this.token) {
        callback(null);
        return;
    }

    var client = this;

    performAuthentication(this, function(err, token) {
        client.token = token;
        callback(err);
    });
};



// Fetches all user ids authenticated by current app.
// - callback: function(error: Error, meta: JSON, ids: Array<Ids>)

Client.prototype.authenticatedIds = function(callback) {
    performAuthenticatedRequest(this.token, { path: '/apps/me/users/ids' }, function(err, meta, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};



// Retrieves a stream with the coresponding key.
// - parameters: { key: String }
// - callback: function(error: Error, meta: JSON, data: JSON)

Client.prototype.retrieveStream = function(parameters, callback) {
    var error = ensureKeys(['key'], parameters);

    if (error) {
        callback(error);
        return;
    }

    performAuthenticatedRequest(this.token, { path: '/streams/' + parameters.key }, callback);
};



// Removes a stream with the coresponding key.
// - parameters: { key: String }
// - callback: function(error: Error, meta: JSON, data: JSON)

Client.prototype.removeStream = function(parameters, callback) {
    var error = ensureKeys(['key'], parameters);

    if (error) {
        callback(error);
        return;
    }

    performAuthenticatedRequest(this.token, { method: 'DELETE', path: '/streams/' + parameters.key }, callback);
};



// Creates a stream with the coresponding key and objectTypes.
// - parameters: { key: String, objectTypes: Array<String> }
// - callback: function(error: Error, meta: JSON, data: JSON)

Client.prototype.createStream = function (parameters, callback) {
    var error = ensureKeys(['key', 'objectTypes'], parameters);

    if (error) {
        callback(error);
        return;
    }

    var body = {
        type: 'long_poll',
        key: parameters.key,
        object_types: parameters.objectTypes
    };

    performAuthenticatedRequest(this.token,  { method: 'POST', path: '/streams', body: body }, callback);
};



// Updates a stream with the coresponding "key" with provided "objectTypes" value.
// - parameters: { key: String, objectTypes: Array<String> }
// - callback: function(error: Error, meta: JSON, data: JSON)

Client.prototype.updateStream = function(parameters, callback) {
    var error = ensureKeys(['key', 'objectTypes'], parameters);

    if (error) {
        callback(error);
        return;
    }

    var body = {
        object_types: parameters.objectTypes
    };

    performAuthenticatedRequest(this.token, { method: 'PUT', path: '/streams/' + parameters.key, body: body }, callback);
};



// Retrieves stream with matching key. If stream doesn't exist it is created.
// - stream: { key: String, objectTypes: Array<String> }
// - callback: function(error: Error, meta: JSON, data: JSON)

Client.prototype.retrieveOrCreateStream = function(stream, callback) {
    var client = this;

    this.retrieveStream(stream, function(err, meta, data) {
        if (err) {
            if (err.code === 404) {
                client.createStream(stream, function(err, meta, data) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, meta, data);
                    }
                });

            } else {
                callback(err);
            }
        } else {
            callback(null, meta, data);
        }
    });
};


// Creates a WebSocket for the given url and calls the callback on events
// - url: String
// - callback: function(event: String, data: Object)

Client.prototype.monitorWebSocket = function(url, callback) {
    monitorWebSocket(url, callback);
};


module.exports = Client;
