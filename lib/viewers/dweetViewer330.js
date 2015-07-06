var dweetClient = require("node-dweetio");
var dweetio = new dweetClient();

function dweetViewer330(config)
{
    var self = this;

	this.config = config;
    this.allowUpdate = true;
    this.interval = setInterval(function(){

        if(!self.allowUpdate || !self.config.thing)
        {
            return;
        }

        self.allowUpdate = false; // Prevent stacking of requests
        dweetio.dweet_for(self.config.thing, self.current_values, self.config.key, function(){
            self.allowUpdate = true;
        });

    }, config.update_interval || 15000);
}

dweetViewer330.prototype.destroy = function()
{
    this.allowUpdate = true;
    clearInterval(this.interval);
}

dweetViewer330.prototype.update = function(exposedComponents)
{
	var values = {};

	for(var index = 0; index < exposedComponents.length; index++)
	{
		var exposedComponent = exposedComponents[index];

		values[exposedComponent.getName()] = exposedComponent.getValue();
	}

    this.current_values = values;
}

module.exports = dweetViewer330;