var _ = require("underscore");
_.str = require("underscore.string");
var fs = require("fs");
var path = require("path");
var async = require("async");
var util = require('util');
var timers = require("timers");
var pid330 = require("./pid330.js");
var config330 = require("./config330.js");
var valueTypes = require("./values330.js");
var components = require("./component330.js");


function getParamNames(func)
{
	var funStr = func.toString();
	return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
}

function loadComponents(componentDirectory, componentFoundCallback)
{
	if(!_.isFunction(componentFoundCallback))
		return;

	componentDirectory = fs.realpathSync(componentDirectory);

	var files = fs.readdirSync(componentDirectory);

	for(var index = 0; index < files.length; index++)
	{
		var file = files[index];
		var filePath = path.join(componentDirectory, file);

		var stats = fs.statSync(filePath);

		if(file == "node_modules")
		{
			continue;
		}

		if(stats.isFile() && path.extname(file) == ".js")
		{
			var component = require(filePath);

			// Callback to tell that we've found a component
			componentFoundCallback(component, filePath);
		}
		else if(stats.isDirectory())
		{
			loadComponents(filePath, componentFoundCallback);
		}
	}
}

/**
 *
 * @class
 * @constructor
 * @param {function} setupFunction - A function that will be called one time when the program is first executed.
 * @param {function} loopFunction - A function that will be called repeatedly at a set interval as the program is executed.
 */
var node330 = function(setupFunction, loopFunction)
{
	var self = this;

	this.valueTypes = valueTypes;
	this.paused = false;
	this.viewers = [];
	this.exposedComponents = [];
	this.configuration = {
		update_interval : 1000
	};

	this.physicalComponentTypes = {};
	this.virtualComponentInstances = {};

	loadComponents(__dirname + "/../components", function(component, componentPath)
	{
		// Does this have any physical components?
		if(!_.isUndefined(component.physicalComponents))
		{
			var physicalComponentTypes = component.physicalComponents;

			if(!_.isArray(physicalComponentTypes))
			{
				physicalComponentTypes = [physicalComponentTypes];
			}

			for(var index = 0; index < physicalComponentTypes.length; index++)
			{
				var physicalComponentType = physicalComponentTypes[index];
				self.physicalComponentTypes[physicalComponentType.name] = physicalComponentType;
			}
		}
	});

	this.injectVirtualComponentsIntoFunction = function(theFunction)
	{
		theFunction.injectedArgs =
		[
		];

		var functionArgNames = getParamNames(theFunction);

		if(_.isNull(functionArgNames))
		{
			return;
		}

		for(var argIndex = 0; argIndex < functionArgNames.length; argIndex++)
		{
			var argName = functionArgNames[argIndex];
			var argNameLower = argName.toLowerCase();
			var argValue = null;

			if(argName in this.virtualComponentInstances)
			{
				argValue = this.virtualComponentInstances[argName];
			}
			else
			{
				if(argNameLower === "node330")
				{
					argValue = this;
				}
				else if(_.str.startsWith(argNameLower, "temp") || _.str.endsWith(argNameLower, "temp"))
				{
					argValue = new components.virtualComponent330(valueTypes.TEMP_IN_C, argName);
				}
				else if(_.str.startsWith(argNameLower, "switch") || _.str.endsWith(argNameLower, "switch"))
				{
					argValue = new components.virtualComponent330(valueTypes.NORMALLY_OFF_SWITCH, argName);
				}
				else if(_.str.startsWith(argNameLower, "pid") || _.str.endsWith(argNameLower, "pid"))
				{
					argValue = new pid330.pid330();
				}
				else if(_.str.startsWith(argNameLower, "config") || _.str.endsWith(argNameLower, "config"))
				{
					// Get the name of the config file
					var configFilename = _.str.strRight(argName, 'config');
					configFilename = _.str.strLeft(configFilename, 'config');

					argValue = new config330(configFilename);
				}

				this.virtualComponentInstances[argName] = argValue;
			}

			theFunction.injectedArgs.push(argValue);
		}
	}

	if(!_.isUndefined(setupFunction))
	{
		if(!_.isFunction(setupFunction))
		{
			throw "setupFunction must be a function.";
		}

		this.setupFunction = setupFunction;
		this.injectVirtualComponentsIntoFunction(setupFunction);
	}

	if(!_.isUndefined(loopFunction))
	{
		if(!_.isFunction(loopFunction))
		{
			throw "loopFunction must be a function.";
		}

		this.loopFunction = loopFunction;
		this.injectVirtualComponentsIntoFunction(loopFunction);
	}
}

node330.prototype.createConsoleViewer = require("./viewers/consoleViewer330.js");
node330.prototype.createWebViewer = require("./viewers/webViewer330.js");

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

/**
 * This callback will be executed when node330 is notifying a viewer that it should update the values from the exposed components.
 * @callback node330~viewerCallback
 * @param components {Array} - An array of components that have been exposed.
 */

/**
 *
 * @param viewer {node330~viewerCallback} - This parameter can be either a pre-built viewer (like web or console) or a callback function that you can implement.
 */
node330.prototype.addViewer = function(viewer)
{
	if(!_.isFunction(viewer))
	{
		throw "The viewer parameter must be a function.";
	}

	this.viewers.push(viewer);
}



/**
 *
 * @param component {component330} - The component you wish to expose to a viewer.
 */
node330.prototype.exposeVirtualComponentToViewers = function(component)
{
	this.exposedComponents.push(component);
}

/**
 *
 * @param physicalComponent
 * @param virtualComponent
 */
node330.prototype.mapPhysicalComponentToVirtualComponent = function(physicalComponent, virtualComponent)
{
	// If virtualComponent is a string, then go ahead and find the component by name
	if(!_.isObject(virtualComponent))
	{
		virtualComponent = this.getVirtualComponentNamed(virtualComponent);
	}

	if(_.isUndefined(virtualComponent))
	{
		throw "Unable to find that virtual component";
	}

	virtualComponent.mapToPhysicalComponent(physicalComponent);
}

/**
 * TODO: Document better
 *
 */
node330.prototype.createPhysicalComponent = function(physicalComponentTypeName, configParams)
{
	if(!(physicalComponentTypeName in this.physicalComponentTypes))
	{
		throw "Could not find a physical component type called '" + physicalComponentTypeName + "'.";
	}

	return new this.physicalComponentTypes[physicalComponentTypeName](configParams);
}

/**
 *
 * @param componentName {string} - The name of a virtual component that has been injected into the engine. This can be useful when you want to refer to a virtual component by name in a config file, for example.
 * @returns {virtualComponent330}
 */
node330.prototype.getVirtualComponentNamed = function(componentName)
{
	return this.virtualComponentInstances[componentName];
}

/**
 * Calls a function and automatically passes in any injected components.
 *
 * @param aFunction {function} - A function that will be executed with injected virtual components.
 */
node330.prototype.do = function(aFunction)
{
	if(!_.isFunction(aFunction))
	{
		throw "Tried 'do'ing an invalid program function.";
	}

	if(_.isUndefined(aFunction.injectedArgs))
	{
		this.injectVirtualComponentsIntoFunction(aFunction);
	}

	aFunction.apply(aFunction, aFunction.injectedArgs);
}

/**
 * Begins the execution of this node330 engine— first by calling the supplied setup function, then by calling the supplied loop function repeatedly.
 */
node330.prototype.run = function()
{
	if(!_.isUndefined(this.mainTimer))
	{
		// Program is already running
		return;
	}

	var self = this;

	// Call our setup function first
	if(!_.isUndefined(this.setupFunction))
	{
		this.setupFunction.apply(this.setupFunction, this.setupFunction.injectedArgs);
	}

	// Our main loop function
	this.mainTimer = timers.setInterval(function()
	{
		if(self.paused)
		{
			return;
		}

		if(!_.isUndefined(self.loopFunction))
		{
			self.loopFunction.apply(self.loopFunction, self.loopFunction.injectedArgs);
		}

		if(self.viewers.length > 0 && self.exposedComponents.length > 0)
		{
			async.applyEach(self.viewers, self.exposedComponents, null);
		}

	}, this.configuration.update_interval);
}

/**
 * Pauses the execution of this node330 engine.
 */
node330.prototype.pause = function()
{
	this.paused = true;
}

/**
 * Resumes the execution of this node330 engine.
 */
node330.prototype.resume = function()
{
	this.paused = false;
}

/**
 * Stop the execution of this node330 engine.
 */
node330.prototype.stop = function()
{
	timers.clearInterval(this.mainTimer);
	this.mainTimer = undefined;
}

/**
 * Create an instance of a node330 engine and run it.
 *
 * @param {function} setupFunction - A function that will be called one time when the program is first executed.
 * @param {function} loopFunction - A function that will be called repeatedly at a set interval as the program is executed.
 * @returns {node330}
 */
node330.run = function(setupFunction, loopFunction)
{
	var node330Instance = new node330(setupFunction, loopFunction);
	node330Instance.run();

	return node330Instance;
}

node330.createPhysicalComponentWithValueFunction = function(valueType, valueFunction)
{
	var component = new components.physicalComponent330(valueType);

	component.getValue = valueFunction;

	return component;
}

/**
 *
 * @module node330
 */
module.exports = node330;
module.exports.valueTypes = valueTypes;
module.exports.pid = pid330;