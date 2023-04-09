module.exports = function (url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        if (xhr.status === 200) {
            cb(null, JSON.parse(xhr.responseText));
        } else {
            var err = new Error('Cannot get ' + url);
            cb(err);
        }
    };
    xhr.send();
};