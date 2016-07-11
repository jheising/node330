var _ = require("underscore");
_.str = require("underscore.string");
var fs = require("fs");
var path = require("path");
var async = require("async");
var util = require('util');
var timers = require("timers");
var pid330 = require("./pid330.js");
var logger330 = require("./logger330.js");
var config330 = require("./config330.js");
var valueTypes = require("./values330.js");
var util330 = require("./util330.js");
var components = require("./component330.js");
var winston = require("winston");
var express = require('express');
//var npm = require("npm");

function getParamNames(func) {
	var funStr = func.toString();
	return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
}

/**
 *
 * @class
 * @constructor
 * @param {string} program - A path to a program file to execute
 */
var node330 = function (config) {
	var self = this;

	this.valueTypes = valueTypes;
	this.paused = false;

	this.viewers = [];
	this.stateMachine = {};
	this.exposedComponents = [];
	this.watchedFilenames = [];
	this.physicalComponentTypes = {};
	this.virtualComponentInstances = {};
	//this.logEntries = [];

	this.config = config;

	this.status = {
		running_node330_version: require('node330/package.json').version,
		running_program: config.program
	};

	// Create our log directory if it doesn't exist
	if (!fs.existsSync(process.cwd() + "/logs")) {
		fs.mkdirSync(process.cwd() + "/logs");
	}

	this.logger = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({
				colorize: true,
				handleExceptions: false
			}),
			new (winston.transports.File)({
				timestamp: true,
				filename: process.cwd() + "/logs/node330.log",
				maxsize: 5242880, // 5 MB
				maxFiles: 10
			})
		]
	});

	// Hold on to the last few log entries
	/*this.logger.on('logging', function (transport, level, msg, meta) {
	 if(self.logEntries.length >= 25)
	 {
	 self.logEntries.pop();
	 }

	 self.logEntries
	 });*/

	// Log all uncaught exceptions to a file
	//this.logger.handleExceptions(new winston.transports.File({ filename: "./logs/exceptions.log" }));

	this.configuration = {
		update_interval: 1000,
		web_ui_server_port: 3300
	};

	function loadComponents(componentDirectory, componentFoundCallback) {
		if (!_.isFunction(componentFoundCallback)) {
			return;
		}

		if (!fs.existsSync(componentDirectory)) {
			return;
		}

		componentDirectory = fs.realpathSync(componentDirectory);

		var files = fs.readdirSync(componentDirectory);

		for (var index = 0; index < files.length; index++) {
			var file = files[index];
			var filePath = path.join(componentDirectory, file);

			var stats = fs.statSync(filePath);

			if (file == "node_modules") {
				continue;
			}

			if (stats.isFile() && path.extname(file) == ".js") {
				self.logInfo("Attempting to load component at '%s'", filePath);

				try {
					var component = require(filePath);

					// Callback to tell that we've found a component
					var keep = componentFoundCallback(component, filePath);

					// If we don't want to keep this module, let's uncache it
					if (!keep) {
						self.logInfo("'%s' does not appear to contain any components.", filePath);
						var name = require.resolve(filePath);
						delete require.cache[name];
					}
				}
				catch (e) {
					self.logError("Loading component '%s' resulted in an error: %s", filePath, e.message);
				}
			}
			else {
				if (stats.isDirectory()) {
					loadComponents(filePath, componentFoundCallback);
				}
			}
		}
	}

	loadComponents(process.cwd() + "/components", function (component, componentPath) {
		// Does this have any physical components?
		if (!_.isUndefined(component.physicalComponents)) {
			var physicalComponentTypes = component.physicalComponents;

			if (!_.isArray(physicalComponentTypes)) {
				physicalComponentTypes = [physicalComponentTypes];
			}

			for (var index = 0; index < physicalComponentTypes.length; index++) {
				var physicalComponentType = physicalComponentTypes[index];
				self.physicalComponentTypes[physicalComponentType.name] = physicalComponentType;

				self.logInfo("Loaded component named '%s'", physicalComponentType.name);
			}

			return true;
		}

		return false;
	});

	this.injectVirtualComponentsIntoFunction = function (theFunction) {
		theFunction.injectedArgs = [
		];

		var functionArgNames = getParamNames(theFunction);

		if (_.isNull(functionArgNames)) {
			return;
		}

		for (var argIndex = 0; argIndex < functionArgNames.length; argIndex++) {
			var argName = functionArgNames[argIndex];
			var argNameLower = argName.toLowerCase();
			var argValue = null;

			if (argName in this.virtualComponentInstances) {
				argValue = this.virtualComponentInstances[argName];
			}
			else if (argNameLower === "node330") {
				argValue = this;
			}
			else if (_.str.startsWith(argNameLower, "logger") || _.str.endsWith(argNameLower, "logger")) {
				argValue = new logger330.logger330();
			}
			else if (_.str.startsWith(argNameLower, "temp") || _.str.endsWith(argNameLower, "temp")) {
				argValue = new components.virtualComponent330(valueTypes.TEMP_IN_C, argName);
			}
			else if (_.str.startsWith(argNameLower, "switch") || _.str.endsWith(argNameLower, "switch")) {
				argValue = new components.virtualComponent330(valueTypes.SWITCH, argName);
			}
			else if (_.str.startsWith(argNameLower, "pid") || _.str.endsWith(argNameLower, "pid")) {
				argValue = new pid330.pid330();
			}
			else if (_.str.startsWith(argNameLower, "config") || _.str.endsWith(argNameLower, "config")) {
				// Get the name of the config file
				var configFilename = _.str.strRight(argName, 'config');
				configFilename = _.str.strLeft(configFilename, 'config');

				argValue = new config330(configFilename);
			}
			else {
				argValue = new components.virtualComponent330(valueTypes.INTEGER, argName);
			}


			this.virtualComponentInstances[argName] = argValue;


			theFunction.injectedArgs.push(argValue);
		}
	}

	process.on('exit', function () {
		self.stop();
	});

	process.on('SIGTERM', function () {
		self.stop();
	});
}

node330.prototype.createVirtualComponent = function (name, valueType) {
	if (_.isUndefined(valueType)) {
		valueType = valueTypes.INTEGER;
	}

	var newComponent = new components.virtualComponent330(valueType, name);

	this.virtualComponentInstances[name] = newComponent;

	return newComponent;
}

node330.prototype.restartIfFileChanges = function (filename) {
	var self = this;

	fs.watchFile(filename, { persistent: false, interval: 5007 }, function (curr, prev) {
		if (curr.mtime > prev.mtime) {
			self.stop();
			self.run();
		}
	});

	this.watchedFilenames.push(filename);
}

node330.prototype.restViewer = function (config) {
	var viewer = require("./viewers/restViewer330.js");

	return new viewer(config);
}

node330.prototype.consoleViewer = function (config) {
	var viewer = require("./viewers/consoleViewer330.js");

	return new viewer(config);
}

node330.prototype.webViewer = function (config) {
	var viewer = require("./viewers/webViewer330.js");

	return new viewer(config);
}

node330.prototype.dweetViewer = function (config) {
	var viewer = require("./viewers/dweetViewer330.js");

	return new viewer(config);
}

/**
 * Define a state as part of a finite state machine.
 *
 * @param stateName {string} - The name of the state.
 * @param [loopFunction] {function} - A function to be called repeatedly during the main execution loop to determine if the state should change.
 * @param [enterFunction] {function} - A function to be executed when the state is entered.
 * @param [leaveFunction] {function} - A function to be executed when the state is left.
 */
node330.prototype.defineState = function (stateName, loopFunction, enterFunction, leaveFunction) {
	if (!_.isUndefined(enterFunction) && !_.isFunction(enterFunction)) {
		throw new Error("enterFunction must define a function.");
	}

	if (!_.isUndefined(loopFunction) && !_.isFunction(loopFunction)) {
		throw new Error("loopFunction must define a function.");
	}

	if (!_.isUndefined(leaveFunction) && !_.isFunction(leaveFunction)) {
		throw new Error("leaveFunction must define a function.");
	}

	if (_.isUndefined(this.stateMachine.states)) {
		this.stateMachine.states = {};
	}

	var state = {};

	state.stateName = stateName;

	state.onEnter = enterFunction;
	if (!_.isUndefined(state.onEnter) && _.isFunction(state.onEnter)) {
		this.injectVirtualComponentsIntoFunction(state.onEnter);
	}

	state.onLoop = loopFunction;
	if (!_.isUndefined(state.onLoop) && _.isFunction(state.onLoop)) {
		this.injectVirtualComponentsIntoFunction(state.onLoop);
	}

	state.onLeave = leaveFunction;
	if (!_.isUndefined(state.onLeave) && _.isFunction(state.onLeave)) {
		this.injectVirtualComponentsIntoFunction(state.onLeave);
	}

	this.stateMachine.states[stateName] = state;
}

/**
 * Define an event as part of a finite state machine.
 *
 * @param eventName {string} - The name of the event.
 * @param startStates {string | Array} - A name or array of names of states that the state must be in for this event to be allowed to occur.
 * @param endState {string} - A name of a state that the state machine should be put into, should this event occur.
 */
node330.prototype.defineStateEvent = function (eventName, startStates, endState) {
	if (!_.isArray(startStates)) {
		startStates = [startStates];
	}

	if (_.isUndefined(this.stateMachine.events)) {
		this.stateMachine.events = {};
	}

	if (_.isUndefined(this.stateMachine.events[eventName])) {
		this.stateMachine.events[eventName] = {};
	}

	var self = this;

	_.each(startStates, function (startState) {

		self.stateMachine.events[eventName][startState] = endState;

	});
}

/**
 *
 * Raise an event as part of a finite state machine.
 *
 * @param eventName {string} - The name of a previously defined state machine event
 */
node330.prototype.raiseStateEvent = function (eventName) {
	var currentState = this.stateMachine.currentState;

	if (_.isUndefined(currentState)) {
		throw new Error("Current state must be defined");
	}

	if (!_.isUndefined(this.stateMachine.events[eventName])) {
		var stateEvent = this.stateMachine.events[eventName];

		// Is this a valid start state?
		if (!_.isUndefined(stateEvent[currentState.stateName])) {
			var newStateName = stateEvent[currentState.stateName];
			this.setCurrentState(newStateName);
		}
		else {
			throw new Error("The event named '" + eventName + "' is not allowed from the current state of '" + currentState.stateName + "'");
		}
	}
}

node330.prototype.setCurrentState = function (newStateName) {
	var currentState = this.stateMachine.currentState;

	// If we're in the same state, then ignore
	if (!_.isUndefined(currentState) && currentState.stateName === newStateName) {
		return;
	}

	if (!_.isUndefined(currentState) && !_.isUndefined(currentState.onLeave)) {
		currentState.onLeave.apply(currentState.onLeave, currentState.onLeave.injectedArgs);
	}

	var newState = this.stateMachine.states[newStateName];

	if (_.isUndefined(newState)) {
		throw new Error("The new state named '" + newStateName + "' does not exist.");
	}

	if (!_.isUndefined(newState) && !_.isUndefined(newState.onEnter)) {
		newState.onEnter.apply(newState.onEnter, newState.onEnter.injectedArgs);
	}

	this.stateMachine.currentState = newState;

	this.logInfo("Entered the %s state", newStateName);
}

/**
 * Returns the current state of the finite state machine.
 *
 * @returns {string}
 */
node330.prototype.getCurrentState = function () {
	if (!_.isUndefined(this.stateMachine.currentState)) {
		return this.stateMachine.currentState.stateName;
	}
	else {
		return "";
	}
}

/*node330.prototype.csvFile = function(config)
 {
 if(_.isUndefined(config))
 {
 config = {};

 if(!fs.existsSync("./logs"))
 {
 fs.mkdirSync("./logs");
 }
 }

 var now = new Date();

 config = _.defaults(config, {
 filename : "./logs/" + now.getMonth() + "-" + now.getDate() + "-" + now.getFullYear() + ".csv"
 });

 function escapeCSValue(value)
 {
 if(_.str.count(",") > 0)
 {
 return '"' + value + '"';
 }
 else
 {
 return value;
 }
 }

 return function(exposedComponents)
 {
 var line = "";
 var header = "";
 var isFirstLine = (!fs.existsSync(config.filename));

 for(var index = 0; index < exposedComponents.length; index++)
 {
 var exposeValue = exposedComponents[index];

 if(isFirstLine)
 {
 if(index >= 1)
 {
 header += ",";
 }

 header += escapeCSValue(exposeValue.shortName);
 }

 if(index >= 1)
 {
 line += ",";
 }

 line += escapeCSValue(exposeValue.value());
 }

 if(isFirstLine)
 {
 fs.appendFile(config.filename, header + "\n");
 }

 fs.appendFile(config.filename, line + "\n");
 }
 }*/

/*node330.prototype.web = function(config)
 {
 if(_.isUndefined(config))
 {
 config = {};
 }

 config = _.defaults(config, {
 port: 3300
 });

 var express = require('express');
 var app = express();
 app.listen(config.port);

 var webValues = {};

 app.use(express.static("public"));

 app.get('/components/:componentName', function(req, res)
 {
 var sensorName = req.params.componentName;

 if(sensorName in webValues)
 {
 res.json(webValues[sensorName]);
 }
 });

 app.get('/components', function(req, res)
 {
 res.json(webValues);
 });

 return function(exposedComponents)
 {
 var tmpValues = {};

 for(var index = 0; index < exposedComponents.length; index++)
 {
 var exposeValue = exposedComponents[index];
 tmpValues[exposeValue.shortName] = {
 value: exposeValue.value(),
 type: valueTypeNames[exposeValue.type]
 };
 }

 webValues = tmpValues;
 }
 }*/

node330.prototype.logInfo = function () {
	var args = ["info"];

	for (var index = 0; index < arguments.length; index++) {
		args.push(arguments[index]);
	}

	this.logger.log.apply(this.logger, args);
}

node330.prototype.logWarning = function () {
	var args = ["warn"];

	for (var index = 0; index < arguments.length; index++) {
		args.push(arguments[index]);
	}

	this.logger.log.apply(this.logger, args);
}

node330.prototype.logError = function () {
	var args = ["error"];

	for (var index = 0; index < arguments.length; index++) {
		args.push(arguments[index]);
	}

	this.logger.log.apply(this.logger, args);
}

/**
 * This callback will be executed when node330 is notifying a viewer that it should update the values from the exposed components.
 * @callback node330~viewerCallback
 * @param components {Array} - An array of components that have been exposed.
 */

/**
 *
 * @param viewer {node330~viewerCallback} - This parameter can be either a pre-built viewer (like web or console) or a callback function that you can implement.
 */
node330.prototype.addViewer = function (viewer) {
	if (_.isFunction(viewer.initialize)) {
		viewer.initialize(this);
	}

	this.viewers.push(viewer);
}


/**
 *
 * @param component {component330} - The component you wish to expose to a viewer.
 */
node330.prototype.exposeVirtualComponentToViewers = function (component, readOnly) {
	if (_.isBoolean(readOnly)) {
		this.setVirtualComponentReadOnly(component, readOnly);
	}
	else {
		this.setVirtualComponentReadOnly(component, true);
	}

	this.exposedComponents.push(component);
}

node330.prototype.setVirtualComponentReadOnly = function (component, readOnly) {
	component.viewerReadOnly = readOnly;
}

/**
 *
 * @param physicalComponent
 * @param virtualComponent
 */
node330.prototype.mapPhysicalComponentToVirtualComponent = function (physicalComponent, virtualComponent) {
	// If virtualComponent is a string, then go ahead and find the component by name
	if (!_.isObject(virtualComponent)) {
		virtualComponent = this.getVirtualComponentNamed(virtualComponent);
	}

	if (_.isUndefined(virtualComponent)) {
		throw new Error("Unable to find that virtual component");
	}

	virtualComponent.mapToPhysicalComponent(physicalComponent);
}

/**
 * TODO: Document better
 *
 */
node330.prototype.createPhysicalComponent = function (physicalComponentTypeName, configParams) {
	if (!(physicalComponentTypeName in this.physicalComponentTypes)) {
		throw new Error("Could not find a physical component type called '" + physicalComponentTypeName + "'.");
	}

	return new this.physicalComponentTypes[physicalComponentTypeName](this, configParams);
}

/**
 *
 * @param componentName {string} - The name of a virtual component that has been injected into the engine. This can be useful when you want to refer to a virtual component by name in a config file, for example.
 * @returns {virtualComponent330}
 */
node330.prototype.getVirtualComponentNamed = function (componentName) {
	return this.virtualComponentInstances[componentName];
}

node330.prototype.createPhysicalComponentWithValueFunction = function (valueType, valueFunction) {
	var component = new components.physicalComponent330(valueType);

	component.getValue = valueFunction;

	return component;
}

/**
 * Calls a function and automatically passes in any injected components.
 *
 * @param aFunction {function} - A function that will be executed with injected virtual components.
 */
node330.prototype.do = function (aFunction) {
	if (!_.isFunction(aFunction)) {
		throw new Error("Tried 'do'ing an invalid program function.");
	}

	if (_.isUndefined(aFunction.injectedArgs)) {
		this.injectVirtualComponentsIntoFunction(aFunction);
	}

	aFunction.apply(aFunction, aFunction.injectedArgs);
}

/**
 * Begins the execution of this node330 engine— first by calling the supplied setup function, then by calling the supplied loop function repeatedly.
 */
node330.prototype.run = function () {
	if (!_.isUndefined(this.mainTimer)) {
		// Program is already running
		return;
	}

	var self = this;

	function startCurrentProgram() {
		if (!_.isUndefined(self.setupFunction)) {
			if (!_.isFunction(self.setupFunction)) {
				throw new Error("setupFunction must be a function.");
			}

			self.injectVirtualComponentsIntoFunction(self.setupFunction);
		}

		if (!_.isUndefined(self.loopFunction)) {
			if (!_.isFunction(self.loopFunction)) {
				throw new Error("loopFunction must be a function.");
			}

			self.injectVirtualComponentsIntoFunction(self.loopFunction);
		}

		if (!_.isUndefined(self.shutdownFunction)) {
			if (!_.isFunction(self.shutdownFunction)) {
				throw new Error("shutdownFunction must be a function.");
			}

			self.injectVirtualComponentsIntoFunction(self.shutdownFunction);
		}

		// Setup our web based UI server
		var app = express();
		self.webUIApp = app;
		self.webServer = app.listen(self.configuration.web_ui_server_port);

		// Serve a status page
		app.get('/status', function (req, res) {
			util330.serveFormattedHTTPResponse(req, res, self.status, {
				xml_root_tag: "status"
			});
		});

		app.get('/logviewer', function(req, res) {
			res.sendfile(__dirname + "/viewers/webViewer330Public/logviewer.html");
		});

		app.get('/log', function (req, res) {

			res.set('Content-Type', 'application/json');

			var log_file;
			var files = fs.readdirSync(process.cwd() + "/logs");

			_.each(files, function(file){

				if(/^node330.*\.log$/.test(file))
				{
					if(!log_file)
					{
						log_file = file;
					}
					else if(file > log_file)
					{
						log_file = file;
					}
				}
			});

			log_file = process.cwd() + "/logs/" + log_file;

			fs.readFile(log_file, "utf8", function (err, data) {

				if (err) {
					return res.send("[]");
				}

				data = data.replace(/\}\r?\n?\{/g, "},{");

				res.send("[" + data + "]");
			});
		});

		self.logInfo("Started a node330 UI web server on port %s", self.configuration.web_ui_server_port);

		// Call our setup function first
		if (!_.isUndefined(self.setupFunction)) {
			self.setupFunction.apply(self.setupFunction, self.setupFunction.injectedArgs);
		}

		// Our main loop function
		self.mainTimer = timers.setInterval(function () {
			if (self.paused) {
				return;
			}

			// Check for any loggers in our injected args and tell them to update
			_.each(self.virtualComponentInstances, function (component) {
				if (component.constructor.name === "logger330") {
					component.update();
				}
			});

			try {
				if (!_.isUndefined(self.loopFunction)) {
					self.loopFunction.apply(self.loopFunction, self.loopFunction.injectedArgs);
				}

				if (!_.isUndefined(self.stateMachine.currentState) && _.isFunction(self.stateMachine.currentState.onLoop)) {
					self.stateMachine.currentState.onLoop.apply(self.stateMachine.currentState.onLoop, self.stateMachine.currentState.onLoop.injectedArgs);
				}
			}
			catch (e) {
				if (_.isString(e)) {
					self.logError("The program loop encountered an error: %s", e);
				}
				else {
					self.logError("The program loop encountered an error: %s", e.message + "\n" + e.stack);
				}
			}

			if (self.viewers.length > 0 && self.exposedComponents.length > 0) {
				_.each(self.viewers, function (viewer) {

					if(_.isFunction(viewer.update))
					{
						viewer.update(self.exposedComponents);
					}
				});
			}

		}, self.configuration.update_interval);

		self.logInfo("node330 has started running");
	}

	if (_.isString(this.config.program)) {
		var programFilename = process.cwd() + "/" + this.config.program;

		// Does this file exist?
		if (fs.existsSync(programFilename)) {
			// Remove the program from the cache if it already exists
			delete require.cache[programFilename];

			var theProgram = require(programFilename);
			this.setupFunction = theProgram.setup;
			this.loopFunction = theProgram.loop;
			this.shutdownFunction = theProgram.shutdown;

			startCurrentProgram();
		}
		else {
			// If the file doesn't exist, check to see if this is an NPM package
			/*npm.load(function(er, npm)
			 {
			 self.logInfo("Finding program named '%s' as NPM package", self.program);
			 npm.commands.install([self.program], function(er, data)
			 {
			 if(er)
			 {
			 throw new Error("Unable to find a program file or npm package named '" + self.program + "'");
			 return;
			 }

			 var theProgram = require(self.program);
			 self.setupFunction = theProgram.setup;
			 self.loopFunction = theProgram.loop;
			 self.shutdownFunction = theProgram.shutdown;

			 startCurrentProgram();
			 });
			 });*/
		}


	}
	else {
		throw new Error("Must specify a program file");
	}
}

/**
 * Pauses the execution of this node330 engine.
 */
node330.prototype.pause = function () {
	this.paused = true;
	this.logInfo("node330 has been paused");
}

/**
 * Resumes the execution of this node330 engine.
 */
node330.prototype.resume = function () {
	this.paused = false;
	this.logInfo("node330 has been resumed");
}

/**
 * Stop the execution of this node330 engine.
 */
node330.prototype.stop = function () {
	timers.clearInterval(this.mainTimer);
	this.mainTimer = undefined;

	// Call our shutdown function
	if (!_.isUndefined(this.shutdownFunction)) {
		this.shutdownFunction.apply(this.shutdownFunction, this.shutdownFunction.injectedArgs);
	}

	_.each(this.watchedFilenames, function (item, index, list) {
		fs.unwatchFile(item);
	});

	_.each(this.viewers, function (item, index, list) {
		if ("destroy" in item && _.isFunction(item["destroy"])) {
			item.destroy();
		}
	});

	_.each(this.virtualComponentInstances, function (item, index, list) {
		if ("destroy" in item && _.isFunction(item["destroy"])) {
			item.destroy();
		}
	});

	// Clear out our basic stuff
	this.stateMachine = {};
	this.viewers = [];
	this.exposedComponents = [];
	this.watchedFilenames = [];
	this.virtualComponentInstances = {};

	if (!_.isUndefined(this.webServer)) {
		this.webServer.close();
	}

	delete this.webUIApp.routes;
	delete this.webUIApp;
	delete this.webServer;

	this.logInfo("node330 has been stopped");
}

/**
 * Create an instance of a node330 engine and run it.
 *
 * @returns {node330}
 */
node330.run = function (config) {
	var node330Instance = new node330(config);
	node330Instance.run();

	return node330Instance;
}

/**
 *
 * @module node330
 */
module.exports = node330;
module.exports.valueTypes = valueTypes;
module.exports.pid = pid330;