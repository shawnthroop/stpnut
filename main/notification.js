'use strict';

// An object describing a push notification.

function Notification(kind, message, userIds, objectId) {
    this.kind = kind;
    this.message = message;
    this.userIds = userIds;
    this.objectId = objectId;
};


// Parses and returns a configured Notification object.
// - blob: { meta: JSON, data: JSON }
// - returns: Notification

function createNotification(json) {
    if (!json) { return null; }

    var meta = json.meta;

    if (!meta) { return null; }

    if (meta.is_deleted === true || !meta.type) {
        return null;
    }

    var note;

    switch (meta.type) {
        case 'bookmark':
            note = createBookmarkNotification(json.data);
            break;

        case 'post':
            note = createPostNotification(json.post);
            break;

        case 'follow':
            note = createFollowNotification(json.data);
            break;
        default:
            break;
    }

    return note;
};


// Creates a Notification object with kind of "repost" or "mention"
// - post: JSON (Post object)
// - returns: Notification

function createPostNotification(post) {
    if (!post) {
        return null;
    }

    if (post.repost_of) {
        var original = post.repost_of;
        var message = '@' + post.user.username + ' reposted: ' + original.content.text;
        return new Notification('repost', message, [original.user.id], post.id);

    } else {
        var mentions = post.content.entities.mentions;

        if (!mentions || (mentions !== null && mentions.length == 0)) {
            return null;
        }

        var ids = [];

        for (var index in mentions) {
            ids.push(mentions[index].id);
        }

        if (ids.length == 0) {
            return null;
        }

        var message = '@' + post.user.username + ' mentioned you: ' + post.content.text;
        return new Notification('mention', message, ids, post.id);
    }
};


// Creates a Notification object with a kind of "bookmark"
// - data: { user: JSON, post: JSON }
// - returns: Notification

function createBookmarkNotification(data) {
    var user = data.user,
        post = data.post;

    if (!user || !post) {
        return null;
    }

    var message = '@' + user.username + ' favorited: ' + post.content.text;
    return new Notification('bookmark', message, [post.user.id], user.id);
};


// Creates a Notification object with kind of "follow"
// - data: { user: JSON, followed_user: JSON }
// - returns: Notification

function createFollowNotification(data) {
    var user = data.user,
        followed = data.followed_user;

    if (!user || !followed) {
        return null;
    }

    var name;

    if (user.name && user.name !== ' ') {
        name = user.name + ' (@' + user.username + ')';
    } else {
        name = '@' + user.username;
    }

    var message = name + ' started following you'
    return new Notification('follow', message, [followed.id], user.id);
}


// Creates a Notification object from App Stream json payload.
// - payload: { meta: JSON, data: JSON }
// - returns: Notification

Notification.createNotificationFromAppStreamPayload = function(payload) {
    return createNotification(payload);
};



module.exports = Notification;
