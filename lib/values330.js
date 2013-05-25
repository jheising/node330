var _ = require("underscore");

var valueTypes = module.exports = {
	INTEGER : 0,
	TEMP_IN_C : 1,
	TEMP_IN_F : 2,
	TEMP_IN_K : 3,
	BARO_IN_PA : 4,
	SWITCH : 5,

	areCompatibleTypes : function(valueType1, valueType2)
	{
		if(valueType1 == valueType2)
		{
			return true;
		}
		else if(valueTypes.isTempValueType(valueType1) && valueTypes.isTempValueType(valueType2))
		{
			return true;
		}
		else if(valueTypes.isBarometricValueType(valueType1) && valueTypes.isBarometricValueType(valueType2))
		{
			return true;
		}
		else if(valueTypes.isSwitchValueType(valueType1) && valueTypes.isSwitchValueType(valueType2))
		{
			return true;
		}

		return false;
	},

	isTempValueType : function(valueType)
	{
		return (valueType == valueTypes.TEMP_IN_C || valueType == valueTypes.TEMP_IN_F || valueType == valueTypes.TEMP_IN_K);
	},

	isSwitchValueType : function(valueType)
	{
		return (valueType == valueTypes.SWITCH);
	},

	isBarometricValueType : function(valueType)
	{
		return (valueType == valueTypes.BARO_IN_PA);
	},

	createConvertFunction : function(inputValueType, returnValueType)
	{
		return function(value)
		{
			// If they aren't compatible types, then just return the value unharmed.
			if(!valueTypes.areCompatibleTypes(inputValueType, returnValueType))
			{
				return value;
			}

			if(valueTypes.isTempValueType(returnValueType))
			{
				return valueTypes.convertTemp(inputValueType, returnValueType, value);
			}

			return value;
		};
	},

	convertTemp : function(inputValueType, returnValueType, inputValue)
	{
		if(inputValueType == returnValueType)
		{
			return inputValue;
		}

		// Normalize to C first
		if(inputValueType == valueTypes.TEMP_IN_F)
		{
			inputValue = (inputValue - 32) * 5 / 9;
		}
		else if(inputValueType == valueTypes.TEMP_IN_K)
		{
			inputValue -= 273.15;
		}

		if(returnValueType == valueTypes.TEMP_IN_F)
		{
			return inputValue * 9 / 5 + 32;
		}
		else if(returnValueType == valueTypes.TEMP_IN_K)
		{
			inputValue += 273.15;
		}

		// If we get here, just return C
		return inputValue;
	},

	addConversionHelperFunctionsToObject : function(object, inputValueType, returnValueType, inputValueFunction)
	{
		// Does this object already have some existing conversion functions? If so, delete them
		if(!_.isUndefined(object.conversionFunctions))
		{
			_.each(object.conversionFunctions, function(value, key, list)
			{
				delete object[key];
			});

			delete object.conversionFunctions;
		}

		if(!valueTypes.areCompatibleTypes(inputValueType, returnValueType))
			return;

		var conversionFunctions = {};

		if(valueTypes.isTempValueType(returnValueType))
		{
			conversionFunctions.tempInC = function(){ return valueTypes.convertTemp(inputValueType, valueTypes.TEMP_IN_C, inputValueFunction.call(object)); };
			conversionFunctions.tempInF = function(){ return valueTypes.convertTemp(inputValueType, valueTypes.TEMP_IN_F, inputValueFunction.call(object)); };
			conversionFunctions.tempInK = function(){ return valueTypes.convertTemp(inputValueType, valueTypes.TEMP_IN_K, inputValueFunction.call(object)); };
			conversionFunctions.isFreezing = function() { return (object.tempInC() <= 0); };
			conversionFunctions.isBloodyFrakingCold = object.isFreezing; // Easter egg
			conversionFunctions.isBoiling = function(){ return (object.tempInC() >= 100); };
		}
		else if(valueTypes.isSwitchValueType(returnValueType))
		{
			conversionFunctions.isOn = function()
			{
				return Boolean(inputValueFunction.call(object));
			};

			conversionFunctions.isOff = function()
			{
				return !object.isOn();
			};
		}

		object.conversionFunctions = conversionFunctions;

		// Map each function to our object
		_.each(object.conversionFunctions, function(value, key, list)
		{
			object[key] = value;
		});
	},

	valueTypeToString : function(valueType)
	{
		for(var keyName in valueTypes)
		{
			var value = valueTypes[keyName];

			if(value === valueType)
			{
				return String(keyName);
			}
		}

		return undefined;
	},

	stringToValueType : function(valueTypeString)
	{
		return valueTypes[valueTypeString];
	}
};