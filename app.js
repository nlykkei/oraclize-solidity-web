var url = require('url');
var fs = require('fs');

function renderHTML(path, resp) {
    fs.readFile(path, null, function (err, data) {
        if (err) {
            resp.writeHead(404, { 'Content-Type': 'text/plain' });
            resp.write('File not found!');
        } else {
            resp.writeHead(200, { 'Content-Type': 'text/html' });
            resp.write(data);
        }
        resp.end();
    });
}

function sortArray(args, resp) {
    resp.writeHead(200, { 'Content-Type': 'text/plain' });

    var numbers = args.split('/');

    // check for malformed input
    var malformed = numbers.some(function (n) {
        return isNaN(n);
    });

    if (malformed) {
        resp.write("Error");
    } else {
        
        // sort array of integers
        numbers.sort(function (a, b) {
            return a - b;
        });

        resp.write(numbers.reduce(function (acc, curr) {
            return acc + curr + " ";
        }, "").trim());
    }

    // return array as space-separated string
    resp.end("");
}


module.exports = {
    handleRequest: function (req, resp) {
        var path = url.parse(req.url).path;
        var index = path.indexOf('/', 1);
        var service = path.substring(1, index);
        var args = path.substring(index + 1);
        switch (service) {
            case 'sort':
                sortArray(args, resp);
                break;
            default:
                renderHTML('./index.html', resp);
                break;
        }
    }
}



