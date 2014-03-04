var dweetClient = require("node-dweetio");
var dweetio = new dweetClient();
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
    if(!this.config.thing)
    {
        return;
    }

	var values = {};

	for(var index = 0; index < exposedComponents.length; index++)
	{
		var exposedComponent = exposedComponents[index];

		values[exposedComponent.getName()] = {
			name        : exposedComponent.getName(),
			display_name: exposedComponent.getDisplayName(),
			value       : exposedComponent.getValue(),
			type        : valueTypes.valueTypeToString(exposedComponent.getValueType()),
			units       : valueTypes.getUnitsString(exposedComponent.getValueType())
		};
	}

    dweetio.dweet_for(this.config.thing, values, this.config.key);
}

module.exports = remoteServerViewer330;