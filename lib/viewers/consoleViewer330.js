module.exports = function(node330, config)
{
	node330.logInfo("Started a node330 console viewer");

	return function(exposedComponents)
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
}