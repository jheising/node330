var _ = require("underscore");
var timers = require("timers");
var CBuffer = require("CBuffer");

var PVHistorySize

function pid330()
{
	this.PV = 0;
	this.CV = 0;
	this.Kp = 0;
	this.Ki = 0;
	this.Kd = 0;
	this.CVLowerLimit = 0;
	this.reset();
}
module.exports.pid330 = pid330;

pid330.prototype.getHistoricalStandardDeviationFromSetPoint = function(secondsPast)
{
	var cutoffTime = Date.now() - (secondsPast * 1000);

	var squaredDifferences = 0;
	var valueCount = 0;

	var self = this;

	this.PVHistory.forEach(function(historicalValue){

		if(historicalValue.time >= cutoffTime)
		{
			valueCount++;
			squaredDifferences += (historicalValue.pv - self.setPoint) ^ 2;
		}
	});

	if(valueCount === 0)
		return -1;

	var variance = squaredDifferences / valueCount;

	return Math.sqrt(variance);
}

pid330.prototype.reset = function()
{
	this.lastMeasurementTime = undefined;
	this.setPoint = 0;
	this.PVHistory = new CBuffer(500); // Hold on to 500 historical process values
	this.previousError = 0;
	this.integral = 0;
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
	this.Ki = Ki;
}

pid330.prototype.setDerivativeGain = function(Kd)
{
	this.Kd = Kd;
}

pid330.prototype.update = function(measuredValue)
{
	var now = Date.now();

	if(_.isUndefined(this.lastMeasurementTime))
	{
		this.lastMeasurementTime = now;
		return this.CVLowerLimit;
	}

	var dt = (now - this.lastMeasurementTime) / 1000.0;
	var input = measuredValue
	var integral = this.integral;

	// Keep a history of our measured values
	this.PVHistory.push({
		time: Date.now(),
		pv  : input
	});

	var error = this.setPoint - input;
	integral = integral + (this.Ki * error * dt);

	if(!_.isUndefined(this.CVUpperLimit) && integral > this.CVUpperLimit)
	{
		integral = this.CVUpperLimit;
	}

	integral = Math.max(0.0, integral);
	var derivative = (error - this.previousError) / dt;

	var CV = this.Kp * error + integral + this.Kd * derivative;

	if(!_.isUndefined(this.CVOffset))
	{
		CV += this.CVOffset;
	}

	CV += this.CVLowerLimit;

	if(!_.isUndefined(this.CVUpperLimit) && CV > this.CVUpperLimit)
	{
		CV = this.CVUpperLimit;
	}

	this.integral = integral;
	this.previousError = error;
	this.lastMeasurementTime = now;

	return CV;
}

pid330.prototype.setControlValueLimits = function(lowerLimit, upperLimit, offset)
{
	this.CVLowerLimit = lowerLimit;
	this.CVUpperLimit = upperLimit;
	this.CVOffset = offset;
}

pid330.prototype.getIntegral = function()
{
    return this.integral;
}

pid330.prototype.setIntegral = function(integral)
{
    this.integral = integral;
}