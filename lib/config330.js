var fs = require("fs");
var path = require('path');
var _ = require("underscore");

function config330(configFilename)
{
	var self = this;
	var configDir = process.cwd() + "/config";

	if(!fs.existsSync(configDir))
	{
		fs.mkdirSync(configDir);
	}

	if(configFilename == "")
	{
		configFilename = "default";
	}

	this.configFile = configDir + "/" + configFilename + ".json";

	if(!fs.existsSync(this.configFile))
	{
		this.config = {};
	}
	else
	{
		try
		{
			this.config = require(this.configFile);
		}
		catch(e)
		{
			this.config = {};
		}
	}

	this.saveSettings = function()
	{
		var settingsString = JSON.stringify(this.config, null, 4);
		fs.writeFileSync(this.configFile, settingsString);
	}
}

config330.prototype.initWithDefaults = function(defaultValues)
{
	var needSave = false;

	for(var key in defaultValues)
	{
		var value = defaultValues[key];

		if(!(key in this.config))
		{
			this.config[key] = value;
			needSave = true;
		}
	}

	if(needSave)
	{
		this.saveSettings();
	}
}

config330.prototype.getSetting = function(settingName, defaultValue)
{
	if(settingName in this.config)
	{
		return this.config[settingName];
	}
	else
	{
		return defaultValue;
	}
}

config330.prototype.setSetting = function(settingName, settingValue)
{
	this.config[settingName] = settingValue;

	this.saveSettings();
}

module.exports = config330;