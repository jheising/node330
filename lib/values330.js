var _ = require("underscore");

var valueTypes = module.exports = {
	INTEGER : "INTEGER",
	TEMP_IN_C : "TEMP_IN_C",
	TEMP_IN_F : "TEMP_IN_F",
	TEMP_IN_K : "TEMP_IN_K",
	PRES_IN_PA : "TEMP_IN_PA",
    PRES_IN_BAR : "TEMP_IN_BAR",
    PRES_IN_MBAR : "PRE_IN_MBAR",
    PRES_IN_INHG : "PRE_IN_INHG",
    RATE_IN_GALLONS_PER_HOUR : "RATE_IN_GALLONS_PER_HOUR",
    PERCENT:"PERCENT", // A percent from 1 - 100
	SWITCH : "SWITCH",
	STRING : "STRING",
    DATE : "DATE",

    getUnitsString : function(valueType)
    {
        if(valueType == valueTypes.TEMP_IN_C)
        {
            return "°C";
        }
        else if(valueType == valueTypes.TEMP_IN_F)
        {
            return "°F";
        }
        else if(valueType == valueTypes.TEMP_IN_K)
        {
            return "°K";
        }
        else if(valueType == valueTypes.PRES_IN_PA)
        {
            return "Pa";
        }
        else if(valueType == valueTypes.PRES_IN_PA)
        {
            return "Pa";
        }
        else if(valueType == valueTypes.PRES_IN_BAR)
        {
            return "bar";
        }
        else if(valueType == valueTypes.PRES_IN_MBAR)
        {
            return "mbar";
        }
        else if(valueType == valueTypes.PRES_IN_INHG)
        {
            return "inHg";
        }
        else if(valueType == valueTypes.RATE_IN_GALLONS_PER_HOUR)
        {
            return "GPH";
        }
        else if(valueType == valueTypes.PERCENT)
        {
            return "%";
        }

        return "";
    },

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
		else if(valueTypes.isPressureValueType(valueType1) && valueTypes.isPressureValueType(valueType2))
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

	isPressureValueType : function(valueType)
	{
		return (valueType == valueTypes.PRES_IN_PA || valueType == valueTypes.PRES_IN_BAR || valueType == valueTypes.PRES_IN_MBAR || valueType == valueTypes.PRES_IN_INHG);
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

    convertPressure : function(inputValueType, returnValueType, inputValue)
    {
        var returnValue = inputValue;

        if(inputValueType == returnValueType)
        {
            returnValue = inputValue;
        }
        else
        {
            // Normalize to pascals
            if(inputValueType == valueTypes.PRES_IN_BAR)
            {
                inputValue = inputValue * 100000;
            }
            else if(inputValueType == valueTypes.PRES_IN_MBAR)
            {
                inputValue = inputValue / 1000 * 100000;
            }
            else if(inputValueType == valueTypes.PRE_IN_INHG)
            {
                inputValue = inputValue * 3386.389;
            }

            // Calculate return
            if(returnValueType == valueTypes.PRES_IN_BAR)
            {
                inputValue = inputValue / 100000;
            }
            else if(returnValueType == valueTypes.PRES_IN_MBAR)
            {
                inputValue = inputValue / 100000 * 1000;
            }
            else if(returnValueType == valueTypes.PRE_IN_INHG)
            {
                inputValue = inputValue / 3386.389;
            }
        }

        return parseFloat(returnValue.toFixed(2));
    },

	convertTemp : function(inputValueType, returnValueType, inputValue)
	{
        var returnValue = inputValue;

		if(inputValueType == returnValueType)
		{
            returnValue = inputValue;
		}
        else
        {
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
                returnValue = inputValue * 9 / 5 + 32;
            }
            else if(returnValueType == valueTypes.TEMP_IN_K)
            {
                returnValue = inputValue + 273.15;
            }
        }

		return parseFloat(returnValue.toFixed(2));
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
        else if(valueTypes.isPressureValueType(returnValueType))
        {
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