var express = require('express');

function webViewer330(config)
{
	this.config = config;
}

webViewer330.prototype.initialize = function(node330)
{
	node330.logInfo("Started a node330 web viewer");

	var app = node330.webUIApp;
	var self = this;

	app.use(express.static(__dirname + '/webViewer330Public'));
}

module.exports = webViewer330;