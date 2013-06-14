var node330 = require("../../lib/node330.js");
var crc32 = require("easy-crc32");
var serial = require("serialport");
var _ = require("underscore");
_.str = require("underscore.string");

function isNumber(n)
{
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function ardusensor(config)
{
	var self = this;

	this.serialport = new serial.SerialPort(config.port, {
		baudrate : config.baudrate,
		parser : serial.parsers.readline("\r\n")
	});

	this.values = {};
    this.allowWrite = false;

	this.serialport.on('data', function(data)
	{
        self.allowWrite = true;
		var sensorCount = _.keys(self.values).length;

		data = _.str.trim(data);

        var dataValues = data.split(":");

        if(dataValues.length != 3)
        {
            return;
        }

		var sensorName  = dataValues[0];
		var sensorValue = dataValues[1];
        var sensorDataCRC = dataValues[2].toUpperCase();

        var calculatedDataCRC = crc32.calculate(sensorName + ":" + sensorValue).toString(16).toUpperCase();

		if(sensorDataCRC != calculatedDataCRC)
		{
            console.log("*** Got a bad crc ***");
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

ardusensor.prototype.sendCommand = function(command)
{
    var crcValue = crc32.calculate(command).toString(16);
    this.serialport.write(command + ":" + crcValue + "\r");
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