#!/usr/bin/env node

var argv = require('optimist').argv;
var forever = require('forever');
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
    if(_.isUndefined(argv.daemon))
    {
        var programPath = path.normalize("./" + argv.program);
        var node330Program = node330.run(programPath);
    }
    else
    {
        var daemon = new (forever.Monitor)(__filename, {
            max: 1,
            silent: false,
            options: ["--program", argv.program],
            /*watch: true,
            watchDirectory: __dirname,
            watchIgnoreDotFiles: true,
            logFile: "./logs/daemon.log"*/
        });

        daemon.on('restart', function () {
            console.log('node330 daemon has restarted.');
        });
        daemon.on('exit', function () {
            console.log('node330 daemon has exited.');
        });

        daemon.start();
    }
}