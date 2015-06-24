var fs = require("fs");
var pathx = require('path');
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
        console.log("***WARN*** config330: specified config file '"+this.configFile+"' does not exist.")
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
            console.log("***WARN*** config330: Error on config file '"+this.configFile+"':"+e)
		}
	}
}

config330.prototype.saveSettings = function()
{
    var settingsString = JSON.stringify(this.config, null, 4);
    fs.writeFile(this.configFile, settingsString);
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

config330.prototype.settingExists = function(settingName)
{
	return (settingName in this.config);
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
    var oldValue = this.config[settingName];

    if(settingValue !== oldValue)
    {
	    this.config[settingName] = settingValue;
        this.saveSettings();
    }
}

config330.prototype.getSectionSetting = function(sectionName, settingName, defaultValue)
{
    if (sectionName in this.config && settingName in this.config[sectionName])
	{
		return this.config[sectionName][settingName];
	}
	else
	{
		return defaultValue;
	}
}

config330.prototype.setSectionSetting = function(sectionName, settingName, settingValue)
{
    var oldValue = this.config[sectionName][settingName];

    if(settingValue !== oldValue)
    {
	    this.config[sectionName][settingName] = settingValue;
        this.saveSettings();
    }
}

config330.prototype.configFileExists = function(configFilename)
{
	var configPath = pathx.join(process.cwd(), "config", configFilename+".json");
    return fs.existsSync(configPath);
}

module.exports = config330;