var _ = require("underscore");

var valueTypes = module.exports = {
    INTEGER : "INTEGER",
    TEMP_IN_C : "TEMP_IN_C",
    TEMP_IN_F : "TEMP_IN_F",
    TEMP_IN_K : "TEMP_IN_K",
    PRES_IN_PA : "PRES_IN_PA",
    PRES_IN_BAR : "PRES_IN_BAR",
    PRES_IN_MBAR : "PRES_IN_MBAR",
    PRES_IN_INHG : "PRES_IN_INHG",
    RATE_IN_GALLONS_PER_HOUR : "RATE_IN_GALLONS_PER_HOUR",
    RATE_IN_CUBIC_METERS_PER_SECOND : "RATE_IN_CUBIC_METERS_PER_SECOND",
    PERCENT: "PERCENT", // A percent from 1 - 100
    FRACTION: "FRACTION",
    SECONDS : "SECONDS",
    HOURS :  "HOURS",
    MILLISECONDS : "MILLISECONDS",
    SWITCH : "SWITCH",
    STRING : "STRING",
    DATE : "DATE",

    // Measurement domain table of units and conversions.
    // factor and offset convert a value to it's domain base unit (first unit of each domain):
    // baseValue = value * unit.factor + unit.offset;  conversely
    // newValue = (baseValue - newUnit.offset) / newUnit.factor;
    // To convert arbitrary units, convert input unit value to base units, then that to output units:
    // outputUnitsValue = (inputValue * inputUnitsFactor + inputUnitsOffset - outputUnitsOffset) / outputUnitsFactor;
    unitsTable: {
        INTEGER :      {name:"INTEGER",      units:"",      domain:"number",      factor: 1.,     offset: 0.},
        TEMP_IN_K :    {name:"TEMP_IN_K",    units:"°K",    domain:"temperature", factor: 1.,     offset: 0.},
        TEMP_IN_C :    {name:"TEMP_IN_C",    units:"°C",    domain:"temperature", factor: 1.,     offset: 273.15},
        TEMP_IN_F :    {name:"TEMP_IN_F",    units:"°F",    domain:"temperature", factor: 5./9.,  offset: 255.372},
        PRES_IN_PA :   {name:"PRES_IN_PA",   units:"Pa",    domain:"pressure",    factor: 1.,     offset: 0.},
        PRES_IN_BAR :  {name:"PRES_IN_BAR",  units:"bar",   domain:"pressure",    factor: 1.e5,   offset: 0.},
        PRES_IN_MBAR : {name:"PRES_IN_MBAR", units:"mbar",  domain:"pressure",    factor: 100.,   offset: 0.},
        PRES_IN_INHG : {name:"PRES_IN_INHG", units:"inHg",  domain:"pressure",    factor: 3386.389, offset: 0.},
        RATE_IN_CUBIC_METERS_PER_SECOND :
                       {name:"RATE_IN_CUBIC_METERS_PER_SECOND",
                                             units:"m^3/s", domain:"flow",        factor: 1.,     offset: 0.},
        RATE_IN_GALLONS_PER_HOUR :
                       {name:"RATE_IN_GALLONS_PER_HOUR",
                                             units:"GPH",   domain:"flow",        factor: 1.0515e-6, offset: 0.},
        FRACTION:      {name:"FRACTION",     units:"",      domain:"number",      factor: 1.,     offset: 0.},
        PERCENT:       {name:"PERCENT",      units:"%",     domain:"number",      factor: .01,    offset: 0.},
        SECONDS :      {name:"SECONDS",      units:"s",     domain:"time",        factor: 1.,     offset: 0.},
        MILLISECONDS : {name:"MILLISECONDS", units:"ms",    domain:"time",        factor: 0.001,  offset: 0.},
        HOURS :        {name:"HOURS",        units:"h",     domain:"time",        factor: 3600.,  offset: 0.},
        SWITCH :       {name:"SWITCH",       units:"",      domain:"boolean",     factor: 1.,     offset: 0.},
        STRING :       {name:"STRING",       units:"",      domain:"text",        factor: undefined, offset: undefined},
        DATE :         {name:"DATE",         units:"",      domain:"date",        factor: undefined, offset: undefined},
    },

    getUnitsString : function(valueType)
    {
        try {return valueTypes.unitsTable[valueType].units;}
        catch (e) {return "";}
    },

    areCompatibleTypes : function(valueType1, valueType2)
    {
        if(valueType1 == valueType2) return true;
        try {return valueTypes.unitsTable[valueType1].domain == valueTypes.unitsTable[valueType2].domain;}
        catch (e) {return false;}
    },

    isTempValueType : function(valueType)
    {
        try {return valueTypes.unitsTable[valueType].domain == 'temperature';}
        catch (e) {return false;}
    },

    isSwitchValueType : function(valueType)
    {
        return (valueType == valueTypes.SWITCH);
    },

    isPressureValueType : function(valueType)
    {
        try {return valueTypes.unitsTable[valueType].domain == 'pressure';}
        catch (e) {return false;}
    },

    isRateValueType : function(valueType)
    {
        try {return valueTypes.unitsTable[valueType].domain == 'flow';}
        catch (e) {return false;}
    },

    isTimeValueType : function(valueType)
    {
        try {return valueTypes.unitsTable[valueType].domain == 'time';}
        catch (e) {return false;}
    },

    convertUnits : function(inputValueType, returnValueType, value)
    {
        // If they are identical or incompatible types, then just return the value unharmed.
        if(_.isUndefined(value) ||
           inputValueType == returnValueType ||
           !valueTypes.areCompatibleTypes(inputValueType, returnValueType))
        {
            return value;
        }
        var inputUnit = valueTypes.unitsTable[inputValueType];
        var returnUnit = valueTypes.unitsTable[returnValueType];
        var returnValue = (value * inputUnit.factor + inputUnit.offset - returnUnit.offset) / returnUnit.factor;

        if (inputUnit.domain == 'temperature' ||
            inputUnit.domain == 'pressure' ||
            returnValueType == 'RATE_IN_GALLONS_PER_HOUR')
        {
            returnValue = parseFloat(returnValue.toFixed(2));
        }
        else if (returnValueType == "INTEGER")
        {
            returnValue = parseFloat(returnValue.toFixed(0));
        }

        return returnValue;
    },

    createConvertFunction : function(inputValueType, returnValueType)
    {
        return function(value) { return valueTypes.convertUnits(inputValueType, returnValueType, value);}
    },
//    getUnitsString : function(valueType)
//    {
//        if(valueType == valueTypes.TEMP_IN_C)
//        {
//            return "°C";
//        }
//        else if(valueType == valueTypes.TEMP_IN_F)
//        {
//            return "°F";
//        }
//        else if(valueType == valueTypes.TEMP_IN_K)
//        {
//            return "°K";
//        }
//        else if(valueType == valueTypes.PRES_IN_PA)
//        {
//            return "Pa";
//        }
//        else if(valueType == valueTypes.PRES_IN_PA)
//        {
//            return "Pa";
//        }
//        else if(valueType == valueTypes.PRES_IN_BAR)
//        {
//            return "bar";
//        }
//        else if(valueType == valueTypes.PRES_IN_MBAR)
//        {
//            return "mbar";
//        }
//        else if(valueType == valueTypes.PRES_IN_INHG)
//        {
//            return "inHg";
//        }
//        else if(valueType == valueTypes.RATE_IN_GALLONS_PER_HOUR)
//        {
//            return "GPH";
//        }
//        else if(valueType == valueTypes.RATE_IN_CUBIC_METERS_PER_SECOND)
//        {
//            return "m^3/s";
//        }
//        else if(valueType == valueTypes.PERCENT)
//        {
//            return "%";
//        }
//
//        return "";
//    },

//    areCompatibleTypes : function(valueType1, valueType2)
//    {
//        if(valueType1 == valueType2)
//        {
//            return true;
//        }
//        else if(valueTypes.isTempValueType(valueType1) && valueTypes.isTempValueType(valueType2))
//        {
//            return true;
//        }
//        else if(valueTypes.isPressureValueType(valueType1) && valueTypes.isPressureValueType(valueType2))
//        {
//            return true;
//        }
//        else if(valueTypes.isRateValueType(valueType1) && valueTypes.isRateValueType(valueType2))
//        {
//            return true;
//        }
//        else if(valueTypes.isSwitchValueType(valueType1) && valueTypes.isSwitchValueType(valueType2))
//        {
//            return true;
//        }
//
//        return false;
//    },

//    isTempValueType : function(valueType)
//    {
//        return (valueType == valueTypes.TEMP_IN_C || valueType == valueTypes.TEMP_IN_F || valueType == valueTypes.TEMP_IN_K);
//    },
//
//    isSwitchValueType : function(valueType)
//    {
//        return (valueType == valueTypes.SWITCH);
//    },
//
//    isPressureValueType : function(valueType)
//    {
//        return (valueType == valueTypes.PRES_IN_PA || valueType == valueTypes.PRES_IN_BAR || valueType == valueTypes.PRES_IN_MBAR || valueType == valueTypes.PRES_IN_INHG);
//    },
//
//    isRateValueType : function(valueType)
//    {
//        return (valueType == valueTypes.RATE_IN_GALLONS_PER_HOUR ||
//                valueType == valueTypes.RATE_IN_CUBIC_METERS_PER_SECOND);
//    },

//    createConvertFunction : function(inputValueType, returnValueType)
//    {
//        return function(value)
//        {
//            // If they aren't compatible types, then just return the value unharmed.
//            if(!valueTypes.areCompatibleTypes(inputValueType, returnValueType))
//            {
//                return value;
//            }
//
//            if(valueTypes.isTempValueType(returnValueType))
//            {
//                return valueTypes.convertTemp(inputValueType, returnValueType, value);
//            }
//
//            if(valueTypes.isPressureValueType(returnValueType))
//            {
//                return valueTypes.convertPressure(inputValueType, returnValueType, value);
//            }
//
//            if(valueTypes.isRateValueType(returnValueType))
//            {
//                return valueTypes.convertRate(inputValueType, returnValueType, value);
//            }
//
//            return value;
//        };
//    },

//    convertPressure : function(inputValueType, returnValueType, inputValue)
//    {
//        var returnValue = inputValue;
//
//        if(inputValueType == returnValueType)
//        {
//            returnValue = inputValue;
//        }
//        else
//        {
//            // Normalize to pascals
//            if(inputValueType == valueTypes.PRES_IN_BAR)
//            {
//                inputValue = inputValue * 100000;
//            }
//            else if(inputValueType == valueTypes.PRES_IN_MBAR)
//            {
//                inputValue = inputValue / 1000 * 100000;
//            }
//            else if(inputValueType == valueTypes.PRES_IN_INHG)
//            {
//                inputValue = inputValue * 3386.389;
//            }
//
//            // Calculate return
//            if(returnValueType == valueTypes.PRES_IN_BAR)
//            {
//                returnValue = inputValue / 100000;
//            }
//            else if(returnValueType == valueTypes.PRES_IN_MBAR)
//            {
//                returnValue = inputValue / 100000 * 1000;
//            }
//            else if(returnValueType == valueTypes.PRE_IN_INHG)
//            {
//                returnValue = inputValue / 3386.389;
//            }
//            else if(returnValueType == valueTypes.PRE_IN_PA)
//            {
//                returnValue = inputValue;
//            }
//        }
//
//        return parseFloat(returnValue.toFixed(2));
//    },
//
//    convertTemp : function(inputValueType, returnValueType, inputValue)
//    {
//        var returnValue = inputValue;
//
//        if(inputValueType == returnValueType)
//        {
//            returnValue = inputValue;
//        }
//        else
//        {
//            // Normalize to C first
//            if(inputValueType == valueTypes.TEMP_IN_F)
//            {
//                inputValue = (inputValue - 32) * 5 / 9;
//            }
//            else if(inputValueType == valueTypes.TEMP_IN_K)
//            {
//                inputValue -= 273.15;
//            }
//
//            if(returnValueType == valueTypes.TEMP_IN_F)
//            {
//                returnValue = inputValue * 9 / 5 + 32;
//            }
//            else if(returnValueType == valueTypes.TEMP_IN_K)
//            {
//                returnValue = inputValue + 273.15;
//            }
//            else if(returnValueType == valueTypes.TEMP_IN_C)
//            {
//                returnValue = inputValue;
//            }
//        }
//
//        return parseFloat(returnValue.toFixed(2));
//    },
//
//    convertRate : function(inputValueType, returnValueType, inputValue)
//    {
//        var returnValue = inputValue;
//
//        if(inputValueType == returnValueType)
//        {
//            returnValue = inputValue;
//        }
//        else
//        {
//            // Normalize to m^3/s first
//            if(inputValueType == valueTypes.RATE_IN_GALLONS_PER_HOUR)
//            {
//                inputValue = inputValue * 1.0515e-6;
//            }
//            // Normalize to m^3/s first
//            if(inputValueType == valueTypes.RATE_IN_GALLONS_PER_HOUR)
//            {
//                returnValue = inputValue / 1.0515e-6;
//            }
//            else if(inputValueType == valueTypes.RATE_IN_CUBIC_METERS_PER_SECOND)
//            {
//                returnValue = inputValue;
//            }
//        }
//        return parseFloat(returnValue.toFixed(2));
//    },

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
            conversionFunctions.tempInC = function(){
                return valueTypes.convertUnits(inputValueType, valueTypes.TEMP_IN_C,
                                               inputValueFunction.call(object));
            };
            conversionFunctions.tempInF = function(){
                return valueTypes.convertUnits(inputValueType, valueTypes.TEMP_IN_F,
                                              inputValueFunction.call(object));
            };
            conversionFunctions.tempInK = function(){
                 return valueTypes.convertUnits(inputValueType, valueTypes.TEMP_IN_K,
                                               inputValueFunction.call(object));
            };
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
        else if(valueTypes.isTimeValueType(returnValueType))
        {
            conversionFunctions.timeInMilliseconds = function(){
                return valueTypes.convertUnits(inputValueType, valueTypes.MILLISECONDS,
                                               inputValueFunction.call(object));
            };
            conversionFunctions.timeInSeconds = function(){
                return valueTypes.convertUnits(inputValueType, valueTypes.SECONDS,
                                               inputValueFunction.call(object));
            };
            conversionFunctions.timeInHours = function(){
                return valueTypes.convertUnits(inputValueType, valueTypes.HOURS,
                                               inputValueFunction.call(object));
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

