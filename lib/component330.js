var events = require('events');
var util = require("util");
var valueTypes = require("./values330.js");
var _ = require("underscore");

function updateValueTypeForComponent(component)
{
	var inputValueType = component.valueType;

	if(!_.isUndefined(component.physicalComponent))
	{
		inputValueValue = component.physicalComponent.valueType;
	}

	valueTypes.addConversionHelperFunctionsToObject(component, inputValueType, component.valueType, component.getValue);
}

function component330(valueType)
{
	this.value = 0;
	this.calibrationOffset = 0;
	this.setValueType(valueType);
}
util.inherits(component330, events.EventEmitter);

component330.prototype.getValueType = function()
{
	return this.valueType;
}

component330.prototype.setValueType = function(valueType)
{
	this.valueType = valueType;
	updateValueTypeForComponent(this);
}

component330.prototype.getCalibrationOffset = function()
{
	return this.calibrationOffset;
}

component330.prototype.setCalibrationOffset = function(offsetValue)
{
	this.calibrationOffset = offsetValue;
}

component330.prototype.getValue = function()
{
	var rawValue = this.value;

	if(this.convertFunction && this.physicalComponent)
	{
		rawValue = this.convertFunction(this.physicalComponent.getValue());
	}

	if(valueTypes.isTempValueType(this.valueType) || valueTypes.isPressureValueType(this.valueType))
	{
		return rawValue + this.calibrationOffset;
	}
	else {
		return rawValue;
	}
}

function physicalComponent330(valueType)
{
	virtualComponent330.super_.call(this, valueType);
}
util.inherits(physicalComponent330, component330);
module.exports.physicalComponent330 = physicalComponent330;

function virtualComponent330(valueType, name)
{
	virtualComponent330.super_.call(this, valueType);

    this.name = name;
	this.displayName = name;
}
util.inherits(virtualComponent330, component330);
module.exports.virtualComponent330 = virtualComponent330;

virtualComponent330.prototype.getName = function()
{
    return this.name;
}

virtualComponent330.prototype.getDisplayName = function()
{
	return this.displayName;
}

virtualComponent330.prototype.setDisplayName = function(displayName)
{
	this.displayName = displayName;
}


virtualComponent330.prototype.setValue = function(value)
{
	this.value = value;
	this.emit("value_set", value);
}

virtualComponent330.prototype.mapToPhysicalComponent = function(physicalComponent)
{
	var self = this;

	this.physicalComponent = physicalComponent;
	this.convertFunction = valueTypes.createConvertFunction(physicalComponent.getValueType(), this.getValueType());

	updateValueTypeForComponent(this);
}

virtualComponent330.prototype.mapToValueFunction = function(valueFunction)
{
    if(!_.isFunction(valueFunction))
    {
        throw "Parameter must be a function that returns a value";
    }

    var self = this;
    this.physicalComponent = undefined;

    this.getValue = valueFunction;

    updateValueTypeForComponent(this);
}