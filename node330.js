#!/usr/bin/env node

var argv = require('optimist').argv;
var path = require("path");
var _ = require("underscore");
var node330 = require("./lib/node330");

if(_.isUndefined(argv.program))
{
    console.log("Must specify a program to run with --program <program_filename>");
    return;
}
else
{
    var programPath = path.normalize("./" + argv.program);
    node330.run(programPath);
}