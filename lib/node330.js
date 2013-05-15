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
 * An execution engine for a node330 program.
 * @class
 * @constructor
 * @param {function} setupFunction - A function that will be run once when the program is executed.
 * @param {function} loopFunction - A function that will be called repeatedly at a set interval as the program is executed.
 */
var node330 = function(setupFunction, loopFunction)
{
	var self = this;

	this.valueTypes = valueTypes;
	this.exposeToFunctions = [];
	this.exposes = [];
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
					argValue = new components.virtualComponent330(valueTypes.TEMP_IN_C);
				}
				else if(_.str.startsWith(argNameLower, "switch") || _.str.endsWith(argNameLower, "switch"))
				{
					argValue = new components.virtualComponent330(valueTypes.NORMALLY_OFF_SWITCH);
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

		this.injectVirtualComponentsIntoFunction(setupFunction);
		setupFunction.apply(setupFunction, setupFunction.injectedArgs);
	}

	if(!_.isUndefined(loopFunction))
	{
		if(!_.isFunction(loopFunction))
		{
			throw "loopFunction must be a function.";
		}

		this.loopFunctionArgs = this.injectVirtualComponentsIntoFunction(loopFunction);
	}

	// Our main loop function
	this.mainTimer = timers.setInterval(function()
	                                    {
		                                    if(!_.isUndefined(loopFunction))
		                                    {
		                                        loopFunction.apply(loopFunction, loopFunction.injectedArgs);
		                                    }

		                                    if(self.exposeToFunctions.length > 0 && self.exposes.length > 0)
		                                    {
		                                        async.applyEach(self.exposeToFunctions, self.exposes, null);
		                                    }

	                                    }, this.configuration.update_interval);
}

node330.prototype.console = function()
{
	return function(exposeValues)
	{
		process.stdout.write("\n");

		for(var index = 0; index < exposeValues.length; index++)
		{
			var exposeValue = exposeValues[index];

			if(index >= 1)
			{
				process.stdout.write("; ");
			}

			process.stdout.write(exposeValue.shortName + ": " + exposeValue.value());
		}
	}
}

node330.prototype.csvFile = function(config)
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

	return function(exposeValues)
	{
		var line = "";
		var header = "";
		var isFirstLine = (!fs.existsSync(config.filename));

		for(var index = 0; index < exposeValues.length; index++)
		{
			var exposeValue = exposeValues[index];

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
}

node330.prototype.web = function(config)
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

	app.get('/sensors/:sensorName', function(req, res)
	{
		var sensorName = req.params.sensorName;

		if(sensorName in webValues)
		{
			res.json(webValues[sensorName]);
		}
	});

	app.get('/sensors', function(req, res)
	{
		res.json(webValues);
	});

	return function(exposeValues)
	{
		var tmpValues = {};

		for(var index = 0; index < exposeValues.length; index++)
		{
			var exposeValue = exposeValues[index];
			tmpValues[exposeValue.shortName] = {
				value: exposeValue.value(),
				type: valueTypeNames[exposeValue.type]
			};
		}

		webValues = tmpValues;
	}
}

node330.prototype.exposeTo = function(exposeToFunction)
{
	if(!_.isFunction(exposeToFunction))
	{
		throw "You must specify a function to expose to.";
	}

	this.exposeToFunctions.push(exposeToFunction);
}

node330.prototype.exposeValue = function(shortName, displayName, type, description, valueFunction)
{
	if(!_.isFunction(valueFunction))
	{
		var value = valueFunction;
		valueFunction = function()
		{
			return value;
		};
	}

	this.exposes.push({
		shortName: shortName,
		displayName: displayName,
		type: type,
		description: description,
		value: valueFunction
	                  });
}

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

node330.prototype.createPhysicalComponent = function(physicalComponentTypeName, configParams)
{
	if(!(physicalComponentTypeName in this.physicalComponentTypes))
	{
		throw "Could not find a physical component type called '" + physicalComponentTypeName + "'.";
	}

	return new this.physicalComponentTypes[physicalComponentTypeName](configParams);
}

node330.prototype.getVirtualComponentNamed = function(argumentName)
{
	return this.virtualComponentInstances[argumentName];
}

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
 * Stop the execution of this node330 engine.
 */
node330.prototype.stop = function()
{
	timers.clearInterval(this.mainTimer);
}

/**
 * Create an instance of a node330 execution engine.
 * @param {function} setupFunction - A function that will be run once when the program is executed.
 * @param {function} loopFunction - A function that will be called repeatedly at a set interval as the program is executed.
 * @returns {node330}
 */
node330.run = function(setupFunction, loopFunction)
{
	return new node330(setupFunction, loopFunction);
}

node330.createPhysicalComponentWithValueFunction = function(valueType, valueFunction)
{
	var component = new components.physicalComponent330(valueType);

	component.getValue = valueFunction;

	return component;
}

module.exports = node330;
module.exports.valueTypes = valueTypes;
module.exports.pid = pid330;