var http = require("http");
var valueTypes = require("./../values330.js");

function remoteServerViewer330(node330, config)
{
	this.config = config;
}

remoteServerViewer330.prototype.destroy = function()
{
}

remoteServerViewer330.prototype.update = function(exposedComponents)
{
	var values = {
		access_code: this.config.access_code,
		components: {}
	};

	for(var index = 0; index < exposedComponents.length; index++)
	{
		var exposedComponent = exposedComponents[index];

		values.components[exposedComponent.getName()] = {
			name        : exposedComponent.getName(),
			display_name: exposedComponent.getDisplayName(),
			value       : exposedComponent.getValue(),
			type        : valueTypes.valueTypeToString(exposedComponent.getValueType()),
			units       : valueTypes.getUnitsString(exposedComponent.getValueType())
		};
	}

	var req = http.request({
		hostname : this.config.host,
		port : this.config.port,
		path: "/things/" + this.config.thing_id + "/status",
		method: "POST",
		headers: {"Content-Type" : "application/json"}
	}, function(res)
	{
	});

	req.on('error', function(e)
	{
		console.log('Unable to update status on remote server: ' + e.message);
	});

	var valueString = JSON.stringify(values, null, 4);

	// write data to request body
	req.write(valueString);
	req.end();
}

module.exports = remoteServerViewer330;

// If the thing_ID is blank, then let's try to create a unique one with our MAC address
/*if(_.isUndefined(config.node330_server_thing_id) || config.node330_server_thing_id === "")
{
	// Fetch the computer's mac address and use it as our device
	require('getmac').getMac(function(err, macAddress)
	{
		if(macAddress)
		{
			config.node330_server_thing_id = macAddress.replace(/:/g, "");
		}

		begin();
	});
}
else
{
	begin();
}*/