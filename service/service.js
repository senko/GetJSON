var
    sys = require('sys'),
    path = require('path'),
    http = require('http'),
    express = require('express'),
    url = require('url'),
    fs = require('fs');

var app = express.createServer();
app.use(express.bodyParser());

app.get('/get/', function(req, res) {
    var target_url = req.param('url', null);
    if (!target_url) {
        console.log('[error] request without an url');
        res.redirect('/');
        return;
    }

    try {
        var parsed_url = url.parse(target_url);
        if (parsed_url.protocol != 'http:')
            throw 'Unsupported protocol';
    } catch (e) {
        console.log('[error] request with invalid url: ' + target_url);
        res.redirect('/');
        return;
    }

    var type = req.param('type', 'string');
    var callback = req.param('callback', null);

    var headers = {
        'Host': parsed_url.host,
        'X-Forwarded-For': req.headers['x-real-ip'],
    };

    var headers_to_copy = [ 'user-agent', 'cache-control',
        'accept', 'accept-language', 'accept-charset' ];
    for (i in headers_to_copy) {
        var h = headers_to_copy[i];
        if (h in req.headers)
            headers[h] = req.headers[h];
    }

    try {
        var proxy = http.createClient(parsed_url.port || 80, parsed_url.host);
        var proxy_request = proxy.request('GET', parsed_url.href, headers);
    } catch (e) {
        console.log('[error] error fetching ' + target_url + ': ' + e);
        res.send("Error fetching the URL", 500);
    }

    var result = '';
    var status_code = 502;

    function return_data() {
        var content_type = 'application/json';

        if (type == 'json') {
            /* decode, then re-encode to ensure it's valid JSON */
            try {
                var raw = JSON.stringify(JSON.parse(result));
            } catch (e) {
                console.log('[error] result not JSON from: ' + target_url);
                res.send("Result is not JSON", 502);
                return;
            }
        } else {
            var raw = JSON.stringify(result);
        }

        if (callback) {
            raw = callback + '(' + raw + ');';
            content_type = 'application/javascript';
        }

        console.log('[info] returning ' + status_code + ' for ' + target_url);
        res.send(raw, {
            'Content-Type': content_type,
            'Access-Control-Allow-Origin': '*'
        }, status_code);
    }

    proxy_request.on('response', function (proxy_response) {
        status_code = proxy_response.statusCode;
        if ((status_code == 301) || (status_code == 302)) {
            var new_url = '/get/?url=' + escape(proxy_response.headers['location']);
            if (type)
                new_url += '&type=' + type;
            if (callback)
                new_url += '&callback=' + callback;

            res.redirect(new_url);
            return;
        }

        proxy_response.on('data', function(chunk) {
            result += chunk;
            if (result.length > (4 * 1024 * 1024)) {
                proxy_request.abort();
                console.log('[error] too large response from ' + target_url);
                res.send('Requested entity too large', 413);
            }
        });

        proxy_response.on('end', function() {
            return_data();
        });
    });

    proxy.on('error', function(err) {
        console.log('[error] error fetching ' + target_url + ': ' + err.message);
        res.send(err.message, 502);
    });

    proxy_request.end();
});

app.post('/getnotified/', function(req, res) {
    var email = req.body.email;
    console.log('[info] email submitted: ' + email);
    fs.open('emails.txt', 'a', function (err, fd) {
        fs.write(fd, email + '\n');
        fs.close(fd, function() {
            res.redirect('/#thanks');
        });
    });
});

app.listen(7010);
