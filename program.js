var _ = require("underscore");
_.str = require("underscore.string");
//var pcduino = require("pcduino");

var arduSensor;

module.exports.setup = function(node330, config, inputTemp, preheaterPID, cvValue, setPoint, pGain, iGain, dGain, cvMin, cvMax)
{
    //pcduino.digital.pinMode(0, 3);
    //pcduino.digital.pinMode(1, 3);

    // Create some default settings, if they don't already exist in a settings file somewhere.
    config.initWithDefaults({
        ardusensor: {
            port: "/dev/ttyS1",
            baudrate: 9600
        }});

    // Set our temperature components to display things in degrees F
    inputTemp.setValueType(node330.valueTypes.TEMP_IN_F);
    setPoint.setValueType(node330.valueTypes.TEMP_IN_F);

    setPoint.setReadOnly(false);
    pGain.setReadOnly(false);
    iGain.setReadOnly(false);
    dGain.setReadOnly(false);
    cvMin.setReadOnly(false);
    cvMax.setReadOnly(false);
    cvValue.setReadOnly(false);

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

    node330.exposeVirtualComponentToViewers(inputTemp);
    node330.exposeVirtualComponentToViewers(cvValue);
    node330.exposeVirtualComponentToViewers(setPoint);
    node330.exposeVirtualComponentToViewers(pGain);
    node330.exposeVirtualComponentToViewers(iGain);
    node330.exposeVirtualComponentToViewers(dGain);
    node330.exposeVirtualComponentToViewers(cvMin);
    node330.exposeVirtualComponentToViewers(cvMax);

    //node330.addViewer(node330.createConsoleViewer());
    node330.addViewer(node330.createWebViewer());

    preheaterPID.setSampleInterval(1000);
};

module.exports.loop = function(node330, inputTemp, preheaterPID, cvValue, setPoint, pGain, iGain, dGain, cvMin, cvMax)
{
    preheaterPID.setProportionalGain(pGain.getValue());
    preheaterPID.setIntegralGain(iGain.getValue());
    preheaterPID.setDerivativeGain(dGain.getValue());
    preheaterPID.setControlValueLimits(cvMin.getValue(), cvMax.getValue(), 0);
    preheaterPID.setDesiredValue(setPoint.getValue());

    preheaterPID.setMeasuredValue(80.0);//inputTemp.tempInF());

    var cv = Math.floor(preheaterPID.getControlValue());
    //console.log("CV: " + cv);
    //ardusensor.sendCommand("5:" + cv);

    cvValue.setValue(cv);
}