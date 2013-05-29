var _ = require("underscore");
_.str = require("underscore.string");
//var pcduino = require("pcduino");

var arduSensor;
var sump_temp_bp_offset;

module.exports.setup = function(node330,
                                config,
                                barometer,
                                drawTemp,
                                preHeaterTemp,
                                preHeaterPID,
                                preHeaterCV,
                                preHeaterSetPoint,
                                preHeaterPGain,
                                preHeaterIGain,
                                preHeaterDGain,
                                preHeaterCVMin,
                                preHeaterCVMax,
                                sumpHeaterTemp,
                                sumpHeaterPID,
                                sumpHeaterCV,
                                sumpHeaterSetPoint,
                                sumpHeaterPGain,
                                sumpHeaterIGain,
                                sumpHeaterDGain,
                                sumpHeaterCVMin,
                                sumpHeaterCVMax)
{

    // Create some default settings, if they don't already exist in a settings file somewhere.
    config.initWithDefaults({
        pre_heater_pin: 5,
        sump_heater_pin: 6,
        sump_temp_bp_offset: -1.5,
        ardusensor: {
            port: "/dev/ttyS1",
            baudrate: 9600
        }});

    // Reset our heaters to zero
    //pcduino.analog.analogWrite(config.getSetting("pre_heater_pin"), 0);
    //pcduino.analog.analogWrite(config.getSetting("sump_heater_pin"), 0);

    // Set our pcDuino serial pins to serial mode
    //pcduino.digital.pinMode(0, 3);
    //pcduino.digital.pinMode(1, 3);

    // Create an ardusensor physical component
    ardusensor = node330.createPhysicalComponent("ardusensor", config.getSetting("ardusensor"));

    // When the ardusensor device says it's sensors are ready, go ahead an map to them to components in our node330 program
    ardusensor.onSensorsReady(function()
    {
        // Load our sensor mappings from our config file
        var sensorMappings = config.getSetting("ardusensor_mappings", {});

        // Get a list of physical sensor IDs reported by the ardusensor
        var sensorIDs = ardusensor.getSubsensorIDs();

        // Loop through each physical sensor and map it to a component as specified in our config file
        for(var index = 0; index < sensorIDs.length; index++)
        {
            var sensorID = sensorIDs[index];
            var sensorMapping = sensorMappings[sensorID];

            // If the sensor mapping doesn't exist in our config file, go ahead and add a default one.
            if(_.isUndefined(sensorMapping))
            {
                sensorMapping = {
                    map_to : "",
                    value_type : node330.valueTypes.valueTypeToString(node330.valueTypes.NUMERIC) // We'll default to a generic NUMERIC value
                };

                sensorMappings[sensorID] = sensorMapping;
            }

            // Ask node330 for the component named in the config file. This will basically equal the name of one of the components that we've passed into the main setup function.
            var virtualComponent = node330.getVirtualComponentNamed(sensorMapping.map_to);

            if(!_.isUndefined(virtualComponent))
            {
                // If the virtual component exists, go ahead and map our physical component to it.
                var subsensorComponent = ardusensor.createPhysicalComponentForSubsensor(sensorID, node330.valueTypes.stringToValueType(sensorMapping.value_type));
                node330.mapPhysicalComponentToVirtualComponent(subsensorComponent, virtualComponent);
            }
        }

        config.setSetting("ardusensor_mappings", sensorMappings);
    });

    node330.exposeVirtualComponentToViewers(drawTemp);
    //node330.exposeVirtualComponentToViewers(barometer);
    drawTemp.setValueType(node330.valueTypes.TEMP_IN_F);

    // Setup our pre heater PID
    preHeaterPID.setSampleInterval(1000);
    preHeaterTemp.setValueType(node330.valueTypes.TEMP_IN_F);
    preHeaterSetPoint.setValueType(node330.valueTypes.TEMP_IN_F);
    preHeaterSetPoint.setReadOnly(false);
    preHeaterPGain.setReadOnly(false);
    preHeaterIGain.setReadOnly(false);
    preHeaterDGain.setReadOnly(false);
    preHeaterCVMin.setReadOnly(false);
    preHeaterCVMax.setReadOnly(false);
    node330.exposeVirtualComponentToViewers(preHeaterTemp);
    node330.exposeVirtualComponentToViewers(preHeaterCV);
    node330.exposeVirtualComponentToViewers(preHeaterSetPoint);
    node330.exposeVirtualComponentToViewers(preHeaterPGain);
    node330.exposeVirtualComponentToViewers(preHeaterIGain);
    node330.exposeVirtualComponentToViewers(preHeaterDGain);
    node330.exposeVirtualComponentToViewers(preHeaterCVMin);
    node330.exposeVirtualComponentToViewers(preHeaterCVMax);
    preHeaterCV.mapToValueFunction(function(){
        return Math.floor(preHeaterPID.getControlValue());
    });

    // Setup our sump heater PID
    sumpHeaterPID.setSampleInterval(1000);
    sumpHeaterTemp.setValueType(node330.valueTypes.TEMP_IN_F);
    sumpHeaterSetPoint.setValueType(node330.valueTypes.TEMP_IN_F);
    sumpHeaterSetPoint.setReadOnly(false);
    sumpHeaterPGain.setReadOnly(false);
    sumpHeaterIGain.setReadOnly(false);
    sumpHeaterDGain.setReadOnly(false);
    sumpHeaterCVMin.setReadOnly(false);
    sumpHeaterCVMax.setReadOnly(false);
    node330.exposeVirtualComponentToViewers(sumpHeaterTemp);
    node330.exposeVirtualComponentToViewers(sumpHeaterCV);
    node330.exposeVirtualComponentToViewers(sumpHeaterSetPoint);
    node330.exposeVirtualComponentToViewers(sumpHeaterPGain);
    node330.exposeVirtualComponentToViewers(sumpHeaterIGain);
    node330.exposeVirtualComponentToViewers(sumpHeaterDGain);
    node330.exposeVirtualComponentToViewers(sumpHeaterCVMin);
    node330.exposeVirtualComponentToViewers(sumpHeaterCVMax);
    sumpHeaterCV.mapToValueFunction(function(){
        return Math.floor(sumpHeaterPID.getControlValue());
    });

    node330.addViewer(node330.createWebViewer());
    //node330.addViewer(node330.createConsoleViewer());

};

module.exports.loop = function(node330,
                               config,
                               barometer,
                               preHeaterTemp,
                               preHeaterPID,
                               preHeaterCV,
                               preHeaterSetPoint,
                               preHeaterPGain,
                               preHeaterIGain,
                               preHeaterDGain,
                               preHeaterCVMin,
                               preHeaterCVMax,
                               sumpHeaterTemp,
                               sumpHeaterPID,
                               sumpHeaterCV,
                               sumpHeaterSetPoint,
                               sumpHeaterPGain,
                               sumpHeaterIGain,
                               sumpHeaterDGain,
                               sumpHeaterCVMin,
                               sumpHeaterCVMax)
{
    // Calculate our boiling point
    var baroInHG = barometer.getValue() / 100 * 0.02953;
    var boilingPoint = Math.log(baroInHG) * 49.160999 + 44.93;

    var sumpHeaterSP = Math.min(255, Math.max(0, boilingPoint + config.getSetting("sump_temp_bp_offset")));

    //console.log("Sump Heater Set Point: " + sumpHeaterSP);

    // Set our pre heater PID values
    preHeaterPID.setProportionalGain(preHeaterPGain.getValue());
    preHeaterPID.setIntegralGain(preHeaterIGain.getValue());
    preHeaterPID.setDerivativeGain(preHeaterDGain.getValue());
    preHeaterPID.setControlValueLimits(preHeaterCVMin.getValue(), preHeaterCVMax.getValue(), 0);
    preHeaterPID.setDesiredValue(preHeaterSetPoint.getValue());
    preHeaterPID.setMeasuredValue(preHeaterTemp.tempInF());

    var cv = preHeaterCV.getValue();

    ardusensor.sendCommand(config.getSetting("pre_heater_pin") + ":" + cv);

    // Set our sump heater PID values
    sumpHeaterPID.setProportionalGain(sumpHeaterPGain.getValue());
    sumpHeaterPID.setIntegralGain(sumpHeaterIGain.getValue());
    sumpHeaterPID.setDerivativeGain(sumpHeaterDGain.getValue());
    sumpHeaterPID.setControlValueLimits(sumpHeaterCVMin.getValue(), sumpHeaterCVMax.getValue(), 0);
    sumpHeaterPID.setDesiredValue(sumpHeaterSP);
    sumpHeaterPID.setMeasuredValue(sumpHeaterTemp.tempInF());

    cv = sumpHeaterCV.getValue();

    ardusensor.sendCommand(config.getSetting("sump_heater_pin") + ":" + cv);
}

module.exports.shutdown = function(config)
{
    // Reset our heaters to zero
    //pcduino.analog.analogWrite(config.getSetting("pre_heater_pin"), 0);
    //pcduino.analog.analogWrite(config.getSetting("sump_heater_pin"), 0);
}