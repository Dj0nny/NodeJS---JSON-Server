var fs = require('fs');
var http = require('http');

function serveFile(file, res) {
    var rs = fs.createReadStream(file);
    var ct = contentForPath(file);
    
    res.writeHead(200, {
        "Content-Type": ct
    });

    rs.on(
        'readable',
        function() {
            var d = rs.read();
            if(d) {
                if(typeof d == 'string') {
                    res.write(d);
                } else if(typeof d == 'object' && d instanceof Buffer) {
                    res.write(d.toString('utf8'));
                }
            } 
        }
    );

    rs.on(
        'end',
        function() {
            res.end();
        }
    );

    rs.on(
        'error',
        function(e) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });
            var err = {
                error: "File not found",
                message: "'" + file + " not found"
            }
            res.end(JSON.stringify(err) + "\n");
            return;
        }
    );
}

function contentForPath(file) {
    return "text/html";
}

function handleRequests(req, res) {
    if(req.method.toLowerCase() == 'get' && req.url.substring(0,9) == '/content/') {
        serveFile(req.url.substring(9), res);
    } else {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });
        var output = {
            error: "File not found", 
            message: "'" + req.url + " not found"
        };
        res.end(JSON.stringify(output) + "\n");
    }
}

var server = http.createServer(handleRequests);
server.listen(9998);
console.log("Server's up");