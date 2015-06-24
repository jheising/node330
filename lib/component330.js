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
	this.setValueType(valueType);
}

component330.prototype.getValueType = function()
{
	return this.valueType;
}

component330.prototype.setValueType = function(valueType)
{
	this.valueType = valueType;
	updateValueTypeForComponent(this);
}

component330.prototype.getValue = function()
{
	return this.value;
}

function physicalComponent330(valueType)
{
	physicalComponent330.super_.call(this, valueType);
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
    if (_.isUndefined(value))
    {
        throw new Error( "Component '"+this.name+"' set to undefined value.")
    }
	this.value = value;
}

virtualComponent330.prototype.mapToPhysicalComponent = function(physicalComponent)
{
	var self = this;

	this.physicalComponent = physicalComponent;

	var convertFunction = valueTypes.createConvertFunction(physicalComponent.getValueType(), this.getValueType());

	this.getValue = function()
	{
		return convertFunction(physicalComponent.getValue());
	}

    if (_.isFunction(physicalComponent.setValue))
    {
    	var inverseConvertFunction = valueTypes.createConvertFunction(this.getValueType(),
                                                                      physicalComponent.getValueType());
        this.setValue = function(value)
        {
            if (_.isUndefined(value))
            {
                throw new Error( "Component '"+this.name+"' set to undefined value.")
            }
            physicalComponent.setValue(inverseConvertFunction(value));
            this.value = value;
        }
    }
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