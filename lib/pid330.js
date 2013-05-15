var _ = require("underscore");
var timers = require("timers");

function pid330()
{
	this.PV = 0;
	this.CV = 0;
	this.Kp = 0;
	this.Ki = 0;
	this.Kd = 0;
	this.processSensor = undefined;
	this.setPoint = 0;

	this.previousInput = 0;
	this.integral = 0;

	this.setSampleInterval(1000);
}
module.exports.pid330 = pid330;

pid330.prototype.setMeasuredValue = function(PV)
{
	this.processSensor = undefined;
	this.PV = PV;
}

pid330.prototype.setMeasurementSensor = function(sensor)
{
	this.processSensor = sensor;
	this.PV = 0;
}

pid330.prototype.setDesiredValue = function(setPoint)
{
	this.setPoint = setPoint;
}

pid330.prototype.setProportionalGain = function(Kp)
{
	this.Kp = Kp;
}

pid330.prototype.setIntegralGain = function(Ki)
{
	this.Ki = Ki * (this.sampleIntervalInMS / 1000);
}

pid330.prototype.setDerivativeGain = function(Kd)
{
	this.Kd = Kd / (this.sampleIntervalInMS / 1000);
}

pid330.prototype.setSampleInterval = function(intervalInMS)
{
	if(!_.isUndefined(this.intervalTimer))
	{
		timers.clearInterval(this.intervalTimer);
		this.intervalTimer = undefined;
	}

	if(intervalInMS <= 0)
	{
		return;
	}

	var ratio = intervalInMS / this.sampleIntervalInMS;
	this.Ki *= ratio;
	this.Kd /= ratio;
	this.sampleIntervalInMS = intervalInMS;

	var self = this;
	this.intervalTimer = timers.setInterval(function()
	                                        {
												var input = self.PV;
		                                        var integral = self.integral;

		                                        if(!_.isUndefined(self.processSensor))
		                                        {
			                                        input = self.processSensor.getValue();
		                                        }

		                                        var error = self.setPoint - input;
		                                        integral += (self.Ki * error);

		                                        if(!_.isUndefined(self.CVUpperLimit) && integral > self.CVUpperLimit)
		                                        {
													integral = self.CVUpperLimit;
		                                        }
		                                        else if(!_.isUndefined(self.CVLowerLimit) && integral < self.CVLowerLimit)
		                                        {
			                                        integral = self.CVLowerLimit;
		                                        }

		                                        var dInput = (input - self.previousInput);

		                                        var CV = self.Kp * error + integral - self.Kd * dInput;


		                                        if(!_.isUndefined(self.CVOffset))
		                                        {
		                                            CV += self.CVOffset;
		                                        }

		                                        if(!_.isUndefined(self.CVUpperLimit) && CV > self.CVUpperLimit)
		                                        {
			                                        CV = self.CVUpperLimit;
		                                        }
		                                        else if(!_.isUndefined(self.CVLowerLimit) && CV < self.CVLowerLimit)
		                                        {
			                                        CV = self.CVLowerLimit;
		                                        }

		                                        self.integral = integral;
		                                        self.previousInput = input;
		                                        self.CV = CV;
		                                        //self.previousError = error;

	                                        }, intervalInMS);
}

pid330.prototype.setControlValueLimits = function(lowerLimit, upperLimit, offset)
{
	this.CVLowerLimit = lowerLimit;
	this.CVUpperLimit = upperLimit;
	this.CVOffset = offset;
}

pid330.prototype.getControlValue = function()
{
	return this.CV;
}