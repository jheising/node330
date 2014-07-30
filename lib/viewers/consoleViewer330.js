function consoleViewer330()
{
}

consoleViewer330.prototype.initialize = function(node330)
{
	node330.logInfo("Started a node330 console viewer");
}

consoleViewer330.prototype.update = function(exposedComponents)
{
	process.stdout.write('\u001B[2J\u001B[0;0f');

	for(var index = 0; index < exposedComponents.length; index++)
	{
		var exposedComponent = exposedComponents[index];
		process.stdout.write(exposedComponent.getDisplayName() + ": " + exposedComponent.getValue() + "\r\n");
	}
}

module.exports = consoleViewer330;