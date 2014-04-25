Node.js PHP built-in Server
===========================

A node.js tool to launch [PHP built-in servers](http://php.net/manual/en/features.commandline.webserver.php).


Requirements
------------

* php >= 5.4.0 on your system.


Installation
------------

```
$ npm install php-built-in-server
```


Usage
-----

```javascript
var PHPServer = require('php-built-in-server');
```

**Simple usage**

```javascript
var server = new PHPServer();

server.on('listening', function (event) {
	console.log('[LISTENING]', event.host.address + ':' + event.host.port);
});

server.on('error', function (event) {
	console.log('[ERROR]', event.error.toString());
});

server.listen();
```

**Explicit parameters**

```javascript
var server = new PHPServer('path/to/phpExecutable', '/path/to/php.ini');

server.on('listening', function (event) {
	console.log('[LISTENING]', event.host.address + ':' + event.host.port);
});

server.on('error', function (event) {
	console.log('[ERROR]', event.error.toString());
});

server.listen('web', '127.0.0.1', 8000, '/path/to/router.php');

```

Show "examples" folder.


TODO
----

* implement php -d foo[=bar]


Known issues
------------

* No data is receive from the child process to confirm explicitly that the server is listening.
* The stderr of the child process logs all queries, not just errors.
* Add to this, the stream has some strange behaviors with Symfony2.


Licence
-------

Copyright (c) 2013 Valéry Herlaud. Licensed under the MIT license. See the file LICENSE.md in this distribution for more details.