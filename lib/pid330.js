var _ = require("underscore");

var pid = function()
{
	this.Kp = 0;
	this.Ki = 0;
	this.Kd = 0;
	this.reset();
}
module.exports = pid;

pid.prototype.reset = function()
{
	this.lastMeasurementTime = 0;
	this.setPoint = 0;
	this.previousError = 0;
	this.integral = 0;
}

pid.prototype.setDesiredValue = function(setPoint)
{
	this.setPoint = setPoint;
}

pid.prototype.setProportionalGain = function(Kp)
{
	this.Kp = Kp;
}

pid.prototype.setIntegralGain = function(Ki)
{
	this.Ki = Ki;
}

pid.prototype.setDerivativeGain = function(Kd)
{
	this.Kd = Kd;
}

pid.prototype.update = function(measuredValue)
{
	var now = Date.now();
	var dt;

	if(!this.lastMeasurementTime)
	{
		dt = 1.0;
	}
	else
	{
		dt = (now - this.lastMeasurementTime) / 1000.0;
	}

	var input = measuredValue;
	var integral = this.integral;

	var error = this.setPoint - input;

	integral = integral + (this.Ki * error * dt);

	var derivative = (error - this.previousError) / dt;

	var CV = this.Kp * error + integral + this.Kd * derivative;

	if(!_.isUndefined(this.CVUpperLimit) && CV > this.CVUpperLimit)
	{
		if(integral > this.integral)
		{
			integral = this.integral;
		}

		CV = this.CVUpperLimit;
	}

	if(!_.isUndefined(this.CVLowerLimit) && CV < this.CVLowerLimit)
	{
		if(integral < this.integral)
		{
			integral = this.integral;
		}

		CV = this.CVLowerLimit;
	}

	this.integral = integral;
	this.previousError = error;
	this.lastMeasurementTime = now;

	return CV;
}

pid.prototype.setControlValueLimits = function(lowerLimit, upperLimit, offset)
{
	this.CVLowerLimit = lowerLimit;
	this.CVUpperLimit = upperLimit;
	this.CVOffset = offset;
}

pid.prototype.getIntegral = function()
{
	return this.integral;
}

pid.prototype.setIntegral = function(integral)
{
	this.integral = integral;
}