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
			util330.serveFormattedHTTPResponse(req, res, valueDisplay, {
				xml_root_tag: "component",
				csv_field_names: ["name", "display_name", "value", "type", "units", "read_only"]
			});
		}
		else
		{
			res.send(404);
		}
	});

	app.get('/components', function(req, res)
	{
		util330.serveFormattedHTTPResponse(req, res, self.displayData, {
			xml_root_tag   : "components",
			csv_field_names: ["name", "display_name", "value", "type", "units", "read_only"]
		});
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