var node330 = require("./../node330.js");
var util = require("util");
var _ = require("underscore");

function sensorInterface330(valueType)
{
	if(!_.isUndefined(valueType))
	{
		this.valueType = valueType;
	}
	else
	{
		this.valueType = node330.valueTypes.NUMERIC;
	}
}
module.exports.sensorInterface330 = sensorInterface330;

sensorInterface330.prototype.getRawValue = function()
{
	return 0;
};

function functionSensorInterface330(valueType, valueFunction)
{
	if(!_.isUndefined(valueType))
	{
		this.valueType = valueType;
	}
	else
	{
		this.valueType = sensorInterface330.valueTypes.NUMERIC;
	}

	this.valueFunction = valueFunction;
}
util.inherits(functionSensorInterface330, sensorInterface330);
module.exports.functionSensorInterface330 = functionSensorInterface330;

functionSensorInterface330.prototype.getRawValue = function()
{
	if(_.isFunction(this.valueFunction))
	{
		return this.valueFunction.call();
	}
	else
	{
		return 0;
	}
};

function sensor330()
{
	this.sensorInterface = new sensorInterface330(node330.valueTypes.NUMERIC);
}

sensor330.prototype.setSensorInterface = function(sensorInterface)
{
	this.sensorInterface = sensorInterface;
}

sensor330.prototype.getValue = function()
{
	return this.sensorInterface.getRawValue();
}

function tempSensor330()
{
	this.sensorInterface = new sensorInterface330(node330.valueTypes.TEMP_IN_C);
}
util.inherits(tempSensor330, sensor330);
module.exports.tempSensor330 = tempSensor330;

tempSensor330.prototype.isFreezing = function()
{
	return (this.getTempInC() <= 0);
}

tempSensor330.prototype.isBoiling = function()
{
	return (this.getTempInC() >= 100);
}

tempSensor330.prototype.getTempInK = function()
{
	return this.getTempInC() + 273.15;
}

tempSensor330.prototype.getTempInC = function()
{
	var rawValue = this.getValue();

	if(this.sensorInterface.valueType == node330.valueTypes.TEMP_IN_C)
	{
		return rawValue;
	}
	else
	{
		return (rawValue - 32) * 5 / 9;
	}
};

tempSensor330.prototype.getTempInF = function()
{
	var rawValue = this.getValue();

	if(this.sensorInterface.valueType == node330.valueTypes.TEMP_IN_F)
	{
		return rawValue;
	}
	else
	{
		return rawValue * 9 / 5 + 32;
	}
};

function switchSensor330()
{
	this.sensorInterface = new sensorInterface330(node330.valueTypes.NUMERIC);
}
util.inherits(switchSensor330, sensor330);
module.exports.switchSensor330 = switchSensor330;

switchSensor330.prototype.getState = function()
{
	return Boolean(this.getValue());
}

switchSensor330.prototype.isOn = function()
{
	return (this.getState() === true);
}

switchSensor330.prototype.isOff = function()
{
	return (this.getState() !== true);
}