#!/usr/bin/env node

var memLeakAgent;
var argv = require('optimist').argv;
var path = require("path");
var _ = require("underscore");
var node330 = require("./lib/node330");

if(_.isUndefined(argv.debug))
{
    memLeakAgent = require('webkit-devtools-agent');
}

if(_.isUndefined(argv.program))
{
    console.log("Must specify a program to run with --program <program_filename or npm_name>");
    return;
}
else
{
    node330.run(argv.program);
}