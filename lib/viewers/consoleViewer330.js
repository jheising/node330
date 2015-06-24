function consoleViewer330(node330, config)
{
	node330.logInfo("Started a node330 console viewer");
}

consoleViewer330.prototype.update = function(exposedComponents)
{
	for(var index = 0; index < exposedComponents.length; index++)
	{
		var exposedComponent = exposedComponents[index];

		if(index >= 1)
		{
			process.stdout.write("; ");
		}

		process.stdout.write(exposedComponent.getDisplayName() + ": " + exposedComponent.getValue());
	}

	process.stdout.write("\n");
}

module.exports = consoleViewer330;