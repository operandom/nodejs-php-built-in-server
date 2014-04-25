var Server = require('../../src/php-built-in-server.js'),
	server = new Server()
;

server.on('error', function (event) {
	console.log('[ERROR]', event.error.toString());
});

server.on('listening', function (event) {
	console.log('[LISTENING]', event.host.address + ':' + event.host.port);
});

server.on('data', function (event) {
	console.log('[DATA]', event.data.toString());
});
 
server.listen();