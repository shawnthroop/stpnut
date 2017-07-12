# stpnut

A simple module for monitoring a [pnut.io App Stream][app-stream].

## Client

Creating, removing, and editing an App Stream requires an App Token obtained by authorizing a properly configured `Client` object.

Configure a `Client` object with your app's `clientId` and `clientSecret`:

    const pnut = require('stpnut');

    var config = {
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET'
    };

    var client = new pnut.Client(config);

> Note: These values can be found in the "Develop" section of [your pnut.io Account][account].

Next, authenticate your `Client` object:

    client.authenticate(function(err) {
        if (err) {
            return console.error(err);
        }

        client.isAuthenticated(); // true
    });


Alternatively, you can pass in an App Token during configuration:

    var client = new pnut.Client({ token: 'YOUR_APP_TOKEN' });
    client.isAuthenticated(); // true


## Streams

Once you have an authenticated `Client` object you can create, remove, and edit App Streams:

    var stream = {
        key: 'main',
        object_types: ['bookmark', 'follow', 'post']
    };

    client.retrieveOrCreateStream(stream, function(err, meta, data) {
        if (err) {
            return console.error(err);
        }

        // Success!
    });

> Note: `meta` and `data` correspond to values of the [response object detailed here][response].


## Notifications

Once you have created an App Stream you can easily monitor it and parse notifications:

    var endpoint = data.endpoint + '?access_token=' + client.token + '&key=' + data.key;

    client.monitorWebSocket(endpoint, function(eventName, eventData) {
        if (eventName === 'message') {
            var note = pnut.Notification.createNotificationFromAppStreamPayload(eventData);

            if (note) {
                console.log(note.message); // @dasdom mentioned you: @shawn What are App Streams? Is this something like web sockets?
            }
        }
    });

> Note: Currently, `Notification.createNotificationFromAppStreamPayload` only supports creating follow, bookmark, mention, and repost notifications.

## Contact

If you have questions, I'm [@shawn][shawn] on pnut.

[app-stream]: https://pnut.io/docs/api/resources/app-streams
[account]: https://pnut.io/account
[response]: https://pnut.io/docs/api/resources/app-streams#post-streams
[shawn]: https://pnut.io/@shawn
