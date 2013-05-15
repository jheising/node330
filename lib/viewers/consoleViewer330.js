module.exports = function(config)
{
	return function(exposedComponents)
	{
		process.stdout.write("\n");

		for(var index = 0; index < exposedComponents.length; index++)
		{
			var exposedComponent = exposedComponents[index];

			if(index >= 1)
			{
				process.stdout.write("; ");
			}

			process.stdout.write(exposedComponent.getDisplayName() + ": " + exposedComponent.getValue());
		}
	}
}