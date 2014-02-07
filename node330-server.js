#!/usr/bin/env node
var argv = require('optimist').argv;
var path = require("path");
var fs = require("fs");
var _ = require("underscore");
var node330 = require("./node330");

var config = {};

config = _.defaults(config, {
	program: argv.program
});

if(_.isUndefined(config.program))
{
	console.log("Must specify a program to run with --program <program_filename or npm_name>");
	return;
}
else
{
	node330.run(config);
}