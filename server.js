#!/usr/bin/env node

var argv = require('optimist').argv;
var _ = require("underscore");
var node330 = require("./lib/node330");

if(!_.isUndefined(argv.program))
{
	var theProgram = require("./" + argv.program);
	var theServer = node330.run(theProgram.setup, theProgram.update);
}