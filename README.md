# GetJSON

## Make ajax requests anywhere

If you're building an awesome web app, there's a lot that you can do - audio, video, 3D, realtime.

But there's one thing you largely can't do: fetch data from anywhere in the internet. Thanks to the XMLHttpRequest same-origin policy, you can only make requests to your own server, or to servers which specifically allowed you to do so.

GetJSON solves this.

### API

The API is just one GET method.

    http://getjson.net/get/?url=http://www.google.com/&callback=fn

Pass in the URL you want to fetch and the callback function name for JSONP requests. The result will be a JSON-encoded text string containing the fetched content.

Optionally, you can specify *type=json* parameter, which will return the decoded JSON object instead of the string value. For this, the original data to be fetched must be JSON as well.

### License and Credits

Copyright © 2011. by Dobar Kod d.o.o. Written by Senko Rašić (@senkorasic).
GetJSON is open source and is licensed under a MIT-style license.

Uses Node.js, Express.js, Twitter Bootstrap and jQuery.
