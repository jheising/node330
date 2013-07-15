var _ = require("underscore");
var js2xmlparser = require("js2xmlparser");

module.exports.serveFormattedHTTPResponse = serveFormattedWebResponse = function(req, res, data, config)
{
	_.defaults(config, {
		xml_root_tag: "items",
		csv_field_names: []
	});
	var format = req.param("format");

	switch (format)
	{
		case "xml":
		{
			res.set('Content-Type', 'application/xml');
			res.send(js2xmlparser(config.xml_root_tag, data));
			break;
		}
		case "csv":
		{
			var displayArray = _.toArray(data);

			res.set('Content-Type', 'text/csv');
			res.send(objectsToCSV(displayArray, config.csv_field_names));
		}
		default:
		{
			res.json(data);
		}
	}
};

module.exports.objectsToCSV = objectsToCSV = function(objects, fieldNames, separator)
{
	if(!_.isArray(objects))
	{
		objects = [objects]
	}

	if((_.isUndefined(fieldNames) || fieldNames.length == 0) && objects.length > 0)
	{
		fieldNames = _.keys(objects[0]);
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