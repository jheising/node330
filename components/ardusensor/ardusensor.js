var node330 = require("../../lib/node330.js");
var serialport = require("serialport");
var _ = require("underscore");
_.str = require("underscore.string");

function isNumber(n)
{
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function ardusensor(config)
{
	var self = this;

	this.serialport = new serialport.SerialPort(config.port, {
		baudrate : config.baudrate,
		parser : serialport.parsers.readline("\r\n")
	});

	this.values = {};

	this.serialport.on('data', function(data)
	{
		var sensorCount = _.keys(self.values).length;

		data = _.str.trim(data);
		var sensorName  = _.str.strLeft(data, ':');
		var sensorValue = _.str.strRight(data, ':');

		if(_.isNull(sensorName) || _.isNull(sensorValue))
		{
			return;
		}

		if(isNumber(sensorValue))
		{
			sensorValue = Number(sensorValue);
		}

		self.values[sensorName] = sensorValue;

		// If the number of sensors hasn't changed, then we can probably assume that all of the sensor values have been reported
		if(_.keys(self.values).length == sensorCount && _.isFunction(self.sensorsReadyCallback))
		{
			self.sensorsReadyCallback();

			if(self.sensorsReadyCallbackCallOnce)
			{
				self.sensorsReadyCallback = false;
			}
		}
	});
}

ardusensor.prototype.loadFromConfig = function(node330Engine, node330Config)
{

}

ardusensor.prototype.createPhysicalComponentForSubsensor = function(subsensorID, valueType)
{
	var self = this;

	return node330.createPhysicalComponentWithValueFunction(valueType, function(){

		return self.values[subsensorID];

	});
}

ardusensor.prototype.onSensorsReady = function(callback, callOnce)
{
	if(_.isUndefined(callOnce))
	{
		callOnce = true;
	}

	this.sensorsReadyCallback = callback;
	this.sensorsReadyCallbackCallOnce = callOnce;
}

ardusensor.prototype.getSubsensorIDs = function()
{
	return _.keys(this.values);
}

module.exports.physicalComponents = [ ardusensor ];