// Our setup function. This will be run once at the beginning of the program.
module.exports.setup = function(
	node330,            // The main node330 object
	mainPID,            // A PID loop. Anything that starts or ends with PID will be injected as a PID
	tempProbe,          // A Temp Probe. Anything that begins or ends with temp will be injected as a Temperature probe
	heaterPower)        // Any other type of parameter will be defined as a standard numeric value
{

}

// Our loop function. This will be run at an interval of once per second.
module.exports.loop = function(node330)
{

}

function simulateTempChange(tempProbe)
{

}

function setHeaterPower()
{
	// Send a command to a sensor or component that will update my heater value.
}