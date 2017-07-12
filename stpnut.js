'use strict';

const Client = require('./main/client.js');
const Notification = require('./main/notification.js');

var STPNUT = STPNUT || {
    Client: Client,
    Notification: Notification
};

module.exports = STPNUT;
