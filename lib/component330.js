var util = require("util");
var valueTypes = require("./values330.js");

function component330(valueType)
{
	this.valueType = valueType;
}

component330.prototype.getValueType = function()
{
	return this.valueType;
}

component330.prototype.getValue = function()
{
	return 0;
}

function virtualComponent330(valueType)
{
	virtualComponent330.super_.call(this, valueType);
}
util.inherits(virtualComponent330, component330);
module.exports.virtualComponent330 = virtualComponent330;

virtualComponent330.prototype.setValueType = function(valueType)
{
	// TODO need to probably re-create our conversion functions based upon changing the value type. Normally this will be done before it's mapped to a physical component so it's shouldn't be a problem for the most part.
	this.valueType = valueType;
}

virtualComponent330.prototype.mapToPhysicalComponent = function(physicalComponent)
{
	this.physicalComponent = physicalComponent;
	this.getValue = physicalComponent.getValue;

	valueTypes.addConversionFunctionsToObject(this, physicalComponent.getValueType(), this.getValueType(), this.getValue);
}

function physicalComponent330(valueType)
{
	virtualComponent330.super_.call(this, valueType);
}
util.inherits(physicalComponent330, component330);
module.exports.physicalComponent330 = physicalComponent330;