var _ = require("underscore");
var valueTypes = require("./../values330.js");
var express = require('express');

function isNumber(n)
{
	return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = function(node330, config)
{
	var app = node330.webUIApp;

	node330.logInfo("Started a node330 web viewer. Values can be viewed at http://my_server:my_port/components");

	var displayData = {};
	var writeableComponents = {};

	// Get the value of the component
	app.all('/components/:componentName', function(req, res)
	{
		var componentName = req.params.componentName;
		var valueDisplay = displayData[componentName];

		var writeValue = req.param("set_value");

		// Are we trying to set a value?
		if(!_.isUndefined(writeValue) && (componentName in writeableComponents))
		{
			if(isNumber(writeValue))
			{
				writeValue = Number(writeValue);
			}

			var writeableComponent = writeableComponents[componentName];
			writeableComponent.setValue(writeValue);

			valueDisplay.value = writeValue;
		}

		if(!_.isUndefined(valueDisplay))
		{
			res.json(valueDisplay);
		}
		else
		{
			res.send(404);
		}
	});

	app.get('/components', function(req, res)
	{
		res.json(displayData);
	});

	return function(exposedComponents)
	{
		var tmpValues = {};
		var tmpWriteable = {};

		for(var index = 0; index < exposedComponents.length; index++)
		{
			var exposedComponent = exposedComponents[index];
			tmpValues[exposedComponent.getDisplayName()] = {
                display_name:exposedComponent.getDisplayName(),
				value: exposedComponent.getValue(),
				type : valueTypes.valueTypeToString(exposedComponent.getValueType()),
				read_only : exposedComponent.getReadOnly()
			};

			if(!exposedComponent.getReadOnly())
			{
				tmpWriteable[exposedComponent.getDisplayName()] = exposedComponent;
			}
		}

		displayData = tmpValues;
		writeableComponents = tmpWriteable;
	}
}