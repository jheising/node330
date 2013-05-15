var _ = require("underscore");
_.str = require("underscore.string");

module.exports.setup = function(node330, config, inputTemp, drawTemp, sumpTemp)
{
	// Create some default settings, if they don't already exist in a settings file somewhere.
	config.initWithDefaults({
		ardusensor: {
			port: "/dev/ttyS1",
			baudrate: 9600
		}});

	// Set our temperature components to display things in degrees F
	inputTemp.setValueType(node330.valueTypes.TEMP_IN_F);
	drawTemp.setValueType(node330.valueTypes.TEMP_IN_F);
	sumpTemp.setValueType(node330.valueTypes.TEMP_IN_F);

	// Create an ardusensor physical component
	var ardusensor = node330.createPhysicalComponent("ardusensor", config.getSetting("ardusensor"));

	// When the ardusensor device says it's sensors are ready, go ahead an map to them to components in our node330 program
	ardusensor.onSensorsReady(function()
	{
		// Load our sensor mappings from our config file
		var sensorMappings = config.getSetting("ardusensor_mappings", {});

		// Get a list of physical sensor IDs reported by the ardusensor
		var sensorIDs = ardusensor.getSubsensorIDs();

		// Loop through each physical sensor and map it to a component as specified in our config file
		for(var index = 0; index < sensorIDs.length; index++)
		{
			var sensorID = sensorIDs[index];
			var sensorMapping = sensorMappings[sensorID];

			// If the sensor mapping doesn't exist in our config file, go ahead and add a default one.
			if(_.isUndefined(sensorMapping))
			{
				sensorMapping = {
					map_to : "",
					value_type : node330.valueTypes.valueTypeToString(node330.valueTypes.NUMERIC) // We'll default to a generic NUMERIC value
				};

				sensorMappings[sensorID] = sensorMapping;
			}

			// Ask node330 for the component named in the config file. This will basically equal the name of one of the components that we've passed into the main setup function.
			var virtualComponent = node330.getVirtualComponentNamed(sensorMapping.map_to);

			if(!_.isUndefined(virtualComponent))
			{
				// If the virtual component exists, go ahead and map our physical component to it.
				var subsensorComponent = ardusensor.createPhysicalComponentForSubsensor(sensorID, node330.valueTypes.stringToValueType(sensorMapping.value_type));
				node330.mapPhysicalComponentToVirtualComponent(subsensorComponent, virtualComponent);
			}
		}

		config.setSetting("ardusensor_mappings", sensorMappings);

		node330.exposeValue("input_temp", "Input Temp", node330.valueTypes.TEMP_IN_F, "The temp of the input wash.", function(){ return inputTemp.tempInF();});
		node330.exposeTo(node330.console());
	});

	/*timers.setInterval(function()
	                   {
							inputTempValue = inputTempValue + (inputTempPID.getControlValue() * 0.20) - (inputTempValue * 0.10);
	                   }, 1000);


	// TODO Remove. This is a function to push in values to our temp
	inputTemp.setSensorInterface(new node330.sensorTypes.functionSensorInterface330(node330.valueTypes.TEMP_IN_F, function()
	{
		return inputTempValue;
	}));

	inputTempPID.setMeasurementSensor(inputTemp);
	inputTempPID.setSampleInterval(2000);
	inputTempPID.setProportionalGain(1);
	inputTempPID.setIntegralGain(0.5);
	inputTempPID.setDerivativeGain(0);

	inputTempPID.setDesiredValue(140.0);*/

	//node330.exposeValue("input_temp", "Input Temp", node330.valueTypes.TEMP_IN_F, "The temp of the input wash.", function(){ return inputTemp.tempInF();});
	//node330.exposeValue("control_value", "Control value", node330.valueTypes.TEMP_IN_F, "", function(){ return inputTempPID.getControlValue();});
	//node330.exposeTo(node330.web());
	//node330.exposeTo(node330.console());
	//node330.exposeTo(node330.csvFile());*/
};

/*module.exports.update = function()
{
	node330.do(checkTemp);
}

function checkTemp(switch1)
{
	var x = switch1.isOn();
	var y = 1;
}*/