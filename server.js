var http = require('http');
var fs = require('fs');

function loadArtistsList(callback) {
    fs.readdir(
        "artists",
        function(err, files) {
            if(err) {
                callback(makeError("file_error", JSON.stringify(err)));
                return;      
            }

            var dirs = new Array();
            (function iterator(index) {
                if(index == files.length) {
                    callback(null, dirs);
                    return;
                }
                fs.stat(
                    'artists/' + files[index],
                    function(err, stats) {
                        if(err) {
                            callback(makeError("file_error", JSON.stringify(err)));
                            return;
                        }
                        if(stats.isDirectory()) {
                            var obj = {name : files[index]};
                            dirs.push(obj);
                        }
                        iterator(index + 1);
                    }
                );
            })(0);
        }
    );
}

function loadArtistRecord(artist, callback) {
    fs.readdir(
        "artists/" + artist,
        function(err, files) {
            if(err) {
                if(err.code == "ENOENT") {
                    callback(noRecord());
                } else {
                    callback(makeError("file_error", JSON.stringify(err)));
                }
                return;
            }
            var records = new Array();
            var path = "artists/" + artist + "/";

            (function iterator(index) {
                if(index == files.length) {
                    var obj = {
                        artist: artist,
                        records: records
                    };
                    callback(null, obj);
                    return;
                }
                fs.stat(
                    path + files[index],
                    function(err, stats) {
                        if(err) {
                            callback(makeError("file_error", JSON.stringify(err)));
                            return;
                        }
                        if(stats.isFile()) {
                            var obj = {
                                Record: files[index]                            };
                            records.push(obj);
                        }
                        iterator(index + 1);
                    }
                );
            })(0);
        }
    );
}

function handleRequests(req, res) {
    console.log("INCOMING REQUEST: " + req.method + " " + req.url); 
    if(req.url == '/artists.json' || req.url === '/favicon.ico') {
        handle_artist_list(req, res);
    }  else if((req.url.substr(0, 8) == '/artists' && req.url.substr(req.url.length - 5) == '.json') || req.url === '/favicon.ico') {
        handle_get_record(req, res);
    } else {
        throwError(res, 404, invalidResource());
    }
}

function handle_artist_list(req, res) {
    loadArtistsList(function(err, artists) {
        if(err) {
            throwError(res, 500, err);
            return;
        }
        sendResponse(res, {artists: artists});
    });
}

function handle_get_record(req, res) {
    var artistName = req.url.substr(8, req.url.length - 13);
    console.log(artistName);
    loadArtistRecord(artistName, function(err, contents) {
        if(err && err.error == "Not an artist") {
            throwError(res, 404, err);
        } else if(err) {
            throwError(res, 500, err);
        } else {
            sendResponse(res, {artistRecord: contents});
        }
    });
}
function makeError(err, msg) {
    var e = new Error(msg);
    e.code = err;
    return e;
}

function sendResponse(res, data) {
    res.writeHead(200, {
        "Content-Type": "application/json"
    });
    var output = {
        data: data
    };
    res.end(JSON.stringify(output) + "\n");
}

function throwError(res, code, err) {
    var code = (err.code) ? err.code : err.name;
    res.writeHead(code, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify({
        error: code,
        message: err.message
    }) + "\n");
}

function invalidResource() {
    return makeError("Invalid resource", "The request resource does not exist");
}

function noRecord() {
    return makeError("No record", "The record does not exists");
}

var server = http.createServer(handleRequests);
server.listen(9999); 
console.log("Server's up");