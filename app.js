var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var path = require('path');

var BigNumber = require('bignumber.js');
var utils = require('./utils.js');

function renderHTML(filePath, res) {

    if (filePath == '/') {
        filePath = '/index.html';
    }

    filePath = __dirname + filePath;
    var extname = path.extname(filePath);
    var contentType = 'text/html';

    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    fs.readFile(filePath, null, function (err, data) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.write('File not found!');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(data);
        }

        res.end();
    });
}

function sortArrayPlain(args, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    args = args.split('/').map(arg => parseInt(arg));

    if (args.some(arg => isNaN(arg))) {
        res.write("Error: Invalid input");
    } else {
        args.sort((x, y) => x - y);
        res.write(args.reduce(function (acc, curr) {
            return acc + curr + " ";
        }, "").trim());
    }

    res.end();
}

function sortArrayBin(args, res) {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });

    args = args.split('/').map(arg => parseInt(arg));

    if (args.some(arg => isNaN(arg))) {
        res.write("Error: Invalid input", "binary");
    } else {
        args.sort((x, y) => x - y);
        args = args.map(n => utils.intTo16BigEndianString(n));
        res.write(args.reduce(function (acc, curr) {
            return acc + curr;
        }), "binary");
    }

    res.end();
}

function sqrt(arg, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    var n = new BigNumber(arg);

    if (n.isNaN) {
        res.write("Error: Invalid input");
    } else {
        res.write(n.sqrt().toString());
    }

    res.end();
}

function minBin(args, res) {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });

    args = args.split('/').map(arg => parseInt(arg));

    if (args.some(arg => isNaN(arg))) {
        res.write("Error: Invalid input", "binary");
    } else {
        if (args.length == 0) {
            min = 0;
        } else {
            min = args[0];
            for (var i = 1; i < args.length; ++i) {
                if (args[i] < min) min = args[i];
            }
        }
        res.write(utils.intTo16BigEndianString(min), "binary");
    }

    res.end();
}

function threeSumBin(args, res) {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });

    args = args.split('/').map(arg => parseInt(arg));

    if (args.some(arg => isNaN(arg))) {
        res.write("Error: Invalid input", "binary");
    } else {
        args = args.map((n, index) => { return { val: n, index: index } });
        S = args.sort((x, y) => x.val - y.val);
        result = threeSum(S);
        if (result.length > 0) {
            res.write(utils.intTo32BigEndianString(((result[0].a.index & 0xFFFF) << 16) + (result[0].b.index & 0xFFFF))
                + utils.intTo16BigEndianString(result[0].c.index & 0xFFFF), "binary");
        }
    }

    res.end();
}

function threeSum(S) {
    var result = [];
    var n = S.length;
    for (var i = 0; i <= n - 3; ++i) {
        var a = S[i];
        var start = i + 1;
        var end = n - 1;
        while (start < end) {
            b = S[start];
            c = S[end];
            if (a.val + b.val + c.val == 0) {
                result.push({ a: a, b: b, c: c });
                // Continue search for all triplet combinations summing to zero
                if (b.val == S[start + 1].val) {
                    start = start + 1;
                } else {
                    end = end - 1;
                }
            } else if (a.val + b.val + c.val > 0) {
                end = end - 1;
            } else {
                start = start + 1;
            }
        }
    }

    return result;
}

function serveGetRequest(req, res) {
    var path = url.parse(req.url).path;
    var index = path.indexOf('/', 1);
    var service = path.substring(1, index);
    var args = path.substring(index + 1);

    switch (service) {
        case 'sort':
            sortArrayPlain(args, res);
            break;
        case 'sortb':
            sortArrayBin(args, res);
            break;
        case 'sqrt':
            sqrt(args, res);
            break;
        case 'min':
            minBin(args, res);
            break;
        case '3sum':
            threeSumBin(args, res);
            break;
        default:
            renderHTML(path, res);
            break;
    }
}

function servePostRequest(req, res) {
    var path = url.parse(req.url).path;
    var index = path.indexOf('/', 1);
    var service = path.substring(1, index);
    var args = path.substring(index + 1);

    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });

    var buffer = Buffer.alloc(0);
    //var data = '';

    req.on('data', function (chunk) {
        buffer = Buffer.concat([buffer, Buffer.from(chunk, 'binary')]);
        //data += chunk.toString('binary');
    });

    req.on('end', function () {
        console.log(buffer.toString('hex'));
        //console.log(querystring.parse(data));
        res.write('Unsupported method: POST', 'binary');
        res.end();
    });
}

module.exports = {
    handleRequest: function (req, res) {

        console.log(req.method);
        console.log(req.headers);
        console.log(req.url);

        if (req.method == 'POST') {
            servePostRequest(req, res);
        }
        else if (req.method == 'GET') {
            serveGetRequest(req, res);
        }
    }
}




