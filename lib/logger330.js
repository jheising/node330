var _ = require("underscore");
var fs = require("fs");

function logger330()
{
	this.components = [];
	this.paused = false;
	this.outputDir = process.cwd() + "/data";
	this.lastUpdate = 0;
	this.config = {
		runsToKeep : 10,
		minUpdateIntervalInSeconds : -1,  // If this is set to -1, then it means to update whenever update is called. Otherwise it's a number of seconds.
		filePrefix : "data"
	};

	if(!fs.existsSync(this.outputDir))
	{
		fs.mkdirSync(this.outputDir);
	}
}

/**
 *
 * @param component {Array|virtualComponent330} - An array of single instance of a virtual component
 */
logger330.prototype.addVirtualComponent = function(component)
{
	if(!_.isArray(component))
	{
		component = [component];
	}

	for(var index = 0; index < component.length; index++)
	{
		this.components.push(component[index]);
	}
}

logger330.prototype.pause = function()
{
	this.paused = true;
}

logger330.prototype.resume = function()
{
	this.paused = false;
}

logger330.prototype.update = function()
{
	if(this.paused)
	{
		return;
	}

	var date = new Date();
	var now = date.getTime();

	// Has enough time has elapsed since our last update?
	if(this.config.minUpdateIntervalInSeconds != -1 && (now - this.lastUpdate) / 1000 < this.config.minUpdateIntervalInSeconds)
	{
		return;
	}

	for(var index = 0; index < this.components.length; index++)
	{

	}

	this.lastUpdate = date.getTime();
}

module.exports.logger330 = logger330;