var _ = require("underscore");
var valueTypes = require("./../values330.js");
var util330 = require("./../util330.js");
var express = require('express');
var js2xmlparser = require("js2xmlparser");

function isNumber(n)
{
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function webViewer330(node330, config)
{
	var self = this;
	var app = node330.webUIApp;

	node330.logInfo("Started a node330 web viewer. Values can be viewed at http://my_server:my_port/components");

	this.displayData = {};
	this.writeableComponents = {};

	// Get the value of the component
	app.all('/components/:componentName', function(req, res)
	{
		var componentName = req.params.componentName;
		var valueDisplay = self.displayData[componentName];

		var writeValue = req.param("set_value");

		// Are we trying to set a value?
		if(!_.isUndefined(writeValue) && (componentName in self.writeableComponents))
		{
			if(isNumber(writeValue))
			{
				writeValue = Number(writeValue);
			}

			var writeableComponent = self.writeableComponents[componentName];
			writeableComponent.setValue(writeValue);

			valueDisplay.value = writeValue;
		}

		if(!_.isUndefined(valueDisplay))
		{
			var format = req.param("format");

			switch(format)
			{
				case "xml":
				{
					res.set('Content-Type', 'application/xml');
					res.send(js2xmlparser("component", valueDisplay));
					break;
				}
				case "csv":
				{
					res.set('Content-Type', 'text/csv');
					res.send(util330.objectsToCSV(valueDisplay, ["name", "display_name", "value", "type", "units",
					                                             "read_only"]));
				}
				default:
				{
					res.json(valueDisplay);
				}
			}
		}
		else
		{
			res.send(404);
		}
	});

	app.get('/components', function(req, res)
	{
		var format = req.param("format");

		switch (format)
		{
			case "xml":
			{
				res.set('Content-Type', 'application/xml');
				res.send(js2xmlparser("components", self.displayData));
				break;
			}
			case "csv":
			{
				var displayArray = _.toArray(self.displayData);

				res.set('Content-Type', 'text/csv');
				res.send(util330.objectsToCSV(
					displayArray,
					["name", "display_name", "value", "type", "units", "read_only"]
				));
			}
			default:
			{
				res.json(self.displayData);
			}
		}

	});
}

webViewer330.prototype.destroy = function()
{
}

webViewer330.prototype.update = function(exposedComponents)
{
	var tmpValues = {};
	var tmpWriteable = {};

	for(var index = 0; index < exposedComponents.length; index++)
	{
		var exposedComponent = exposedComponents[index];

		tmpValues[exposedComponent.getName()] = {
			name        : exposedComponent.getName(),
			display_name: exposedComponent.getDisplayName(),
			value       : exposedComponent.getValue(),
			type        : valueTypes.valueTypeToString(exposedComponent.getValueType()),
			units       : valueTypes.getUnitsString(exposedComponent.getValueType()),
			read_only   : exposedComponent.viewerReadOnly
		};

		if(!exposedComponent.viewerReadOnly)
		{
			tmpWriteable[exposedComponent.getName()] = exposedComponent;
		}
	}

	this.displayData = tmpValues;
	this.writeableComponents = tmpWriteable;
}

module.exports = webViewer330;