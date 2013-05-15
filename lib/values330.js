var valueTypes = module.exports = {
	NUMERIC : 0,
	TEMP_IN_C : 1,
	TEMP_IN_F : 2,
	TEMP_IN_K : 3,
	BARO_IN_PA : 4,
	NORMALLY_ON_SWITCH : 5,
	NORMALLY_OFF_SWITCH : 6,

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
		return (valueType == valueTypes.NORMALLY_ON_SWITCH || valueType == valueTypes.NORMALLY_OFF_SWITCH);
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
		if(!valueTypes.areCompatibleTypes(inputValueType, returnValueType))
			return;

		if(valueTypes.isTempValueType(returnValueType))
		{
			object.tempInC = function(){ return valueTypes.convertTemp(inputValueType, valueTypes.TEMP_IN_C, inputValueFunction()); };
			object.tempInF = function(){ return valueTypes.convertTemp(inputValueType, valueTypes.TEMP_IN_F, inputValueFunction()); };
			object.tempInK = function(){ return valueTypes.convertTemp(inputValueType, valueTypes.TEMP_IN_K, inputValueFunction()); };
			object.isFreezing = function() { return (object.tempInC() <= 0); };
			object.isBloodyFrakingCold = object.isFreezing; // Easter egg
			object.isBoiling = function(){ return (object.tempInC() >= 100); };
		}
		else if(valueTypes.isSwitchValueType(returnValueType))
		{
			object.isOn = function() { return Boolean(inputValueFunction()); };
			object.isOff = function() { return !object.isOn(); };
		}
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