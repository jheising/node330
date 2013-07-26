#!/usr/bin/env node
var argv = require('optimist').argv;
var path = require("path");
var fs = require("fs");
var _ = require("underscore");
var node330 = require("./lib/node330");

var configFilename = process.cwd() + "/node330-config.json";
var config = {};

// Is there a config file?
if(fs.existsSync(configFilename))
{
	config = require(configFilename);
}

config = _.defaults(config, {
	program: argv.program
});

// Save our config, in case any haven't been initialized yet
var configString = JSON.stringify(config, null, 4);
fs.writeFileSync(configFilename, configString);

if(_.isUndefined(config.program))
{
    console.log("Must specify a program to run with --program <program_filename or npm_name>");
    return;
}
else
{
    node330.run(config);
}