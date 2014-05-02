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

	d('routerFilePath', undefined);
	d('iniFilePath', undefined);

	d('defaultPhpExecPath', 'php');
	d('defaultRoot', process.cwd());
	d('defaultAddress', '0.0.0.0');
	d('defaultPort', 0);
	
	dgs('phpExecPath',
		function () {
			return this.explicitPhpExecPath || this.defaultPhpExecPath || this.constructor.prototype.defaultPhpExecPath;
		},
		function (value) {
			this.explicitPhpExecPath = value;
		}
	);
	dgs('root',
		function () {
			return this.explicitRoot || this.defaultRoot || this.contructor.prototype.defaultRoot;
		},
		function (value) {
			this.explicitRoot = value;
		}
	);
	dgs('address',
		function () {
			return this.explicitAddress || this.defaultAddress || this.constructor.prototype.defaultAddress;
		},
		function (value) {
			this.explicitAddress = value;
		}
	);
	dgs('port',
		function () {
			return this.explicitPort || this.defaultPort || this.constructor.prototype.defaultPort;
		},
		function (value) {
			this.explicitPort = value;
		}
	);

	d('getProcessParameters', getProcessParameters);
	d('getProcessOptions', getProcessOptions);

	d('process', undefined);

	d('listen', listen);
	d('close', closeConnection);
	d('launchProcess', launchProcess);

}



/* API */


function listen(root, port, address, routerFilePath, iniDirectives) {

	this.root = root;
	this.address = address;
	this.port = port;
	this.routerFilePath = routerFilePath;
	this.iniDirectives = iniDirectives;


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
			emit('close', emitter, this, {code: code});
		});

		this.process.on('error', function (error) {
			emit('error', emitter, this, {error: error});
		});

		this.process.stdin.on('data', function (data) {
			emit('data', emitter, this, {data: data});
		});

		this.process.stdout.on('data', function (data) {
			emit('data', emitter, this, {data: data});
		});

		this.process.stderr.on('data', function (data) {
			emit('error', emitter, this, {error: data});
		});

		emit('listening', emitter, this, {
			host: {
				address: get(this, 'address'),
				port: this.port
			}
		});

	} catch (error) {

		emit('error', emitter, this, {error: error});

	}

}


function getProcessParameters() {

	var a = ['-S', get(this, 'address') + ':' + this.port];

	if (this.routerFilePath) {
		a.push(path.resolve(this.routerFilePath));
	}
	
	if (this.iniDirectives) {
		for (var key in this.iniDirectives) {
			a.splice(0, 0, '-d', key + '=' + this.iniDirectives[key]);
		}
	}

	if (this.iniFilePath) {
		a.splice(0, 0, '-c', path.resolve(this.iniFilePath));
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


function dgs(name, getter, setter) {
	Object.defineProperty(PHPServer.prototype, name, {
		configurable: true,
		enumerable: true,
		get: getter,
		set: setter
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


function emit(type, emitter, target, eventObject) {

	eventObject.type = type;
	eventObject.emitter = emitter;
	eventObject.target = target;

	emitter.emit(type, eventObject);

}