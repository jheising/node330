// Our setup function. This will be run once at the beginning of the program.
module.exports.setup = function (node330,
                                 runSwitch,
                                 mainPID,
                                 tempSensor,
                                 tempSetPoint
) {
    node330.addViewer(node330.consoleViewer());
    node330.addViewer(node330.restViewer());
    node330.addViewer(node330.webViewer());

    node330.exposeVirtualComponentToViewers(runSwitch, false);
    node330.exposeVirtualComponentToViewers(tempSensor, true);
    node330.exposeVirtualComponentToViewers(tempSetPoint, false);

    tempSetPoint.setValueType(node330.valueTypes.TEMP_IN_C);

    mainPID.setProportionalGain(1);
    mainPID.setIntegralGain(1);
}

// Our loop function. This will be run at an interval of once per second.
module.exports.loop = function (node330, runSwitch, tempSensor, tempSetPoint, mainPID) {
    if (runSwitch.isOn()) {
        // Tell our PID the value we want to reach
        mainPID.setDesiredValue(tempSetPoint.getValue());

        // Calculate our control value
        var controlValue = Math.round(mainPID.update(tempSensor.getValue()));

        // Simulate a temperature change based on our control value
        var simulatedTemperature = Number((tempSensor.getValue() + (controlValue * 0.20) - (tempSensor.getValue() * 0.10)).toFixed(3));
        tempSensor.setValue(simulatedTemperature);
    }
}