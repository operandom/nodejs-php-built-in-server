'use strict';

var util = require('util'),
	path = require('path'),
	EventEmitter = require('events').EventEmitter,

	net = require('net'),
	spawn = require('child_process').spawn

	;

module.exports = (function () {

	config();
	return PHPServer;

})();



/* CONSTRUCTOR */


function PHPServer(phpExecPath, iniFilePath) {
	this.phpExecPath = phpExecPath;
	this.iniFilePath = iniFilePath;
}



/* CONFIG */


function config() {

	util.inherits(PHPServer, EventEmitter);

	d('phpExecPath', 'php');
	d('routerFilePath', undefined);
	d('iniFilePath', undefined);

	d('root', process.cwd());
	d('address', '0.0.0.0');
	d('port', 0);

	d('getProcessParameters', getProcessParameters);
	d('getProcessOptions', getProcessOptions);

	d('process', undefined);

	d('listen', listen);
	d('close', closeConnection);
	d('launchProcess', launchProcess);
}



/* API */


function listen(root, port, address, routerFilePath) {

	this.root = root;
	this.address = address;
	this.port = port;
	this.routerFilePath = routerFilePath;


	if (this.port) {
		this.launchProcess();
	} else {
		findFreePort(findFreePortHandler.bind(this));
	}
}


function closeConnection() {

	if (this.process) {
		this.process.removeAllListeners();
		this.process.kill();

		disposeSocket(this.process.stdin);
		disposeSocket(this.process.stdout);
		disposeSocket(this.process.stderr);

		this.process = undefined;
	}
}



/* METHOD */


function launchProcess() {

	var emitter = this;

	try {

		this.process = spawn(
			get(this, 'phpExecPath'),
			this.getProcessParameters(),
			this.getProcessOptions()
		);

		this.process.on('close', function (code) {
			emitter.emit('close', {
				target: this,
				emitter: emitter,
				code: code
			});
		});

		this.process.on('error', function (error) {
			emitter.emit('error', {
				target: this,
				emitter: emitter,
				error: error
			});
		});

		this.process.stdin.on('data', function (data) {
			emitter.emit('data', {
				target: this,
				emitter: emitter,
				data: data
			});
		});

		this.process.stdout.on('data', function (data) {
			emitter.emit('data', {
				target: this,
				emitter: emitter,
				data: data
			});
		});

		this.process.stderr.on('data', function (data) {
			emitter.emit('error', {
				target: this,
				emitter: emitter,
				error: data
			});
		});

		this.emit('listening', {
			target: emitter,
			emitter: emitter,
			host: {
				address: get(this, 'address'),
				port: this.port
			}
		});

	} catch (error) {

		this.emit('error', {
			target: this,
			type: 'catch',
			error: error
		});

	}


}


function getProcessParameters() {

	var a = ['-S', get(this, 'address') + ':' + this.port];

	if (this.routerFilePath) {
		a.push(path.resolve(this.routerFilePath));
	}

	if (this.iniFilePath) {
		a.push('-c', path.resolve(this.iniFilePath));
	}

	return a;
}


function getProcessOptions() {
	return {
		cwd: path.resolve(get(this, 'root')),
		env: process.env,
		detached: false,
		stdio: ['pipe', 'pipe', 'pipe']
	};
}



/* HANDLERS */


function findFreePort(callback) {

	var server = net.createServer();

	server.once('listening', function listeningHandler() {
		var port = server.address().port;
		server.once('close', function closeHandler() {
			callback(null, port);
		});
		server.close();
	});

	server.listen(0);
}



/* TOOLS */


function d(name, value) {

	Object.defineProperty(PHPServer.prototype, name, {
		value: value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}


function findFreePortHandler(error, port) {
	if (error) {
		this.emit('error', error);
	} else {
		this.port = port;
		this.launchProcess();
	}
}


function disposeSocket(socket) {
	socket.removeAllListeners();
	socket.destroy();
}

function get(target, name) {
	return target[name] || target.constructor.prototype[name];
}