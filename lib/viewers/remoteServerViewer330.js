var dweetClient = require("node-dweetio");
var dweetio = new dweetClient();
var valueTypes = require("./../values330.js");

function remoteServerViewer330(node330, config)
{
	this.config = config;
    this.allowUpdate = true;
}

remoteServerViewer330.prototype.destroy = function()
{
    this.allowUpdate = true;
}

remoteServerViewer330.prototype.update = function(exposedComponents)
{
    if(!this.allowUpdate || !this.config.thing)
    {
        return;
    }

    var self = this;

	var values = {};

	for(var index = 0; index < exposedComponents.length; index++)
	{
		var exposedComponent = exposedComponents[index];

		values[exposedComponent.getName()] = exposedComponent.getValue();
	}

    self.allowUpdate = false; // Prevent stacking of requests
    dweetio.dweet_for(this.config.thing, values, this.config.key, function(){

        self.allowUpdate = true;

    });
}

module.exports = remoteServerViewer330;