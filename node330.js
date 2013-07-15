#!/usr/bin/env node

var agent = require('webkit-devtools-agent');

var argv = require('optimist').argv;
var path = require("path");
var _ = require("underscore");
var node330 = require("./lib/node330");

if(_.isUndefined(argv.program))
{
    console.log("Must specify a program to run with --program <program_filename or npm_name>");
    return;
}
else
{
    node330.run(argv.program);
}