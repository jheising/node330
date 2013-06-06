var _ = require("underscore");

module.exports.objectsToCSV = objectsToCSV = function(objects, fieldNames, separator)
{
	if(!_.isArray(objects))
	{
		objects = [objects]
	}

	var outputStr = "";
	var index;

	if(_.isUndefined(separator))
	{
		separator = ",";
	}

	// Create our header
	for(index = 0; index < fieldNames.length; index++)
	{
		var fieldName = fieldNames[index];

		if(index > 0)
		{
			outputStr += separator;
		}

		if(_.isNumber(fieldName))
		{
			outputStr += fieldName;
		}
		else
		{
			outputStr += '"' + fieldName + '"';
		}
	}

	outputStr += "\n";

	for(index = 0; index < objects.length; index++)
	{
		var object = objects[index];

		for(var index2 = 0; index2 < fieldNames.length; index2++)
		{
			var fieldName = fieldNames[index2];

			if(index2 > 0)
			{
				outputStr += separator;
			}

			if(fieldName in object)
			{
				var value = object[fieldName];

				if(_.isNumber(value))
				{
					outputStr += value;
				}
				else
				{
					outputStr += '"' + value + '"';
				}
			}
		}

		outputStr += "\r\n";
	}

	return outputStr;
}