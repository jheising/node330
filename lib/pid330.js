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
	this.processSensor = undefined;
	this.reset();
	this.sampleIntervalInMS = 1000;
	this.setSampleInterval(1000);
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
	this.setPoint = 0;
	this.PVHistory = new CBuffer(500); // Hold on to 500 historical process values
	this.previousError = 0;
	this.integral = 0;
}

pid330.prototype.setMeasuredValue = function(PV)
{
	this.processSensor = undefined;
	this.PV = PV;

	// Keep a history of our measured values
	this.PVHistory.push({
			time: Date.now(),
			pv  : PV
		});
}

pid330.prototype.setMeasurementSensor = function(sensor)
{
	this.processSensor = sensor;
	this.PV = 0;
	this.PVHistory = new CBuffer(500);
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

	this.sampleIntervalInMS = intervalInMS;

	var self = this;
	this.intervalTimer = timers.setInterval(function()
	{
        var dt = self.sampleIntervalInMS / 1000.0;
		var input = self.PV;
		var integral = self.integral;

		if(!_.isUndefined(self.processSensor))
		{
			input = self.processSensor.getValue();
		}

		var error = self.setPoint - input;
		integral = integral + (self.Ki * error * dt);

		if(!_.isUndefined(self.CVUpperLimit) && integral > self.CVUpperLimit)
		{
			integral = self.CVUpperLimit;
		}

        integral = Math.max(0.0, integral);
        var derivative = (error - self.previousError) / dt;

        var CV = self.Kp * error + integral + self.Kd * derivative;

		if(!_.isUndefined(self.CVOffset))
		{
			CV += self.CVOffset;
		}

        CV += self.CVLowerLimit;

		if(!_.isUndefined(self.CVUpperLimit) && CV > self.CVUpperLimit)
		{
			CV = self.CVUpperLimit;
		}

		self.integral = integral;
		self.previousError = error;
		self.CV = CV;

	}, intervalInMS);
}

pid330.prototype.destroy = function()
{
	if(!_.isUndefined(this.intervalTimer))
	{
		timers.clearInterval(this.intervalTimer);
		this.intervalTimer = undefined;
	}
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

pid330.prototype.getIntegral = function()
{
    return this.integral;
}

pid330.prototype.setIntegral = function(integral)
{
    this.integral = integral;
}