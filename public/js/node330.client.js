head.ready(function () {
    function formatTimestamp(time) {
        var dt = new Date();
        dt.setTime(time);
        var d = (dt.getHours() + 1) + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        return d;
    }

    function node330Component() {
        var self = this;

        this.name = ko.observable();
        this.display_name = ko.observable();
        this.type = ko.observable();
        this.read_only = ko.observable();
        this.value = ko.observable();
        this.units = ko.observable();
        this.description = ko.observable();

        // Behaviors
        this.startEditing = function () {
            return true;
        }

        this.endEditing = function () {
            if (!this.read_only()) {
                var value = this.value();

                if (this.type() == "SWITCH") {
                    value = Number(value);
                }

                $.get("components/" + this.name() + "?set_value=" + value)
            }

            return true;
        }


    }

    function node330UIModel() {
        var self = this;

        self.components = ko.observableArray();

        self.loadJSONData = function (data) {

	        var componentValues = {};

            // Loop through our input data and see if it matches to one of our components
            _.each(data, function (jsonValue, jsonKey, jsonList) {

                var component = ko.utils.arrayFirst(self.components(), function (item) {
                    return (jsonKey === item.name());
                });

                if (_.isNull(component)) {
                    component = new node330Component();
                    self.components.push(component);
                }

                component.name(jsonValue.name);
                component.display_name(jsonValue.display_name);
                component.type(jsonValue.type);
                component.read_only(jsonValue.read_only);
                component.value(jsonValue.value);
                component.units(jsonValue.units);
                component.description(jsonValue.description);

	            componentValues[jsonValue.name] = jsonValue.value;
            });

	        // Update our gauges
	        if("preHeaterTemp" in componentValues)
	        {
		        preHeaterTempGauge.setValue(componentValues["preHeaterTemp"]);
	        }
	        else
	        {
		        preHeaterTempGauge.setValue(0);
	        }

	        if("preHeaterPower" in componentValues)
	        {
		        preHeaterPowerGauge.setValue(componentValues["preHeaterPower"]);
	        }
	        else
	        {
		        preHeaterPowerGauge.setValue(0);
	        }

            if("sumpTemp1" in componentValues)
            {
                mainHeaterTempGauge.setValue(componentValues["sumpTemp3"]);
            }
            else
            {
                mainHeaterTempGauge.setValue(0);
            }

            if("mainHeaterPower" in componentValues)
            {
                mainHeaterPowerGauge.setValue(componentValues["mainHeaterPower"]);
            }
            else
            {
                mainHeaterPowerGauge.setValue(0);
            }
        }
    }

    var uiModel = new node330UIModel();

    ko.applyBindings(uiModel);

    var uiUpdateTimer = setInterval(function () {
        // Get latest values
        $.getJSON('components', function (data) {
            uiModel.loadJSONData(data);
        });

    }, 1000);

    function createTempGauge(id, min, max, ticks)
    {

    var gauge = new Gauge({
        renderTo  : id,
        width     : 300,
        height    : 300,
        glow      : false,
        units     : '°F',
        title     : 'Temp',
        strokeTicks : true,
        minorTicks  : 4,
        majorTicks  : ticks,
        minValue: min,
        maxValue: max,
	    colors: {
		    plate     : '#0a0a0a',
		    majorTicks: '#73c5e2',
		    minorTicks: '#73c5e2',
		    title     : '#888',
		    units     : '#888',
		    numbers   : '#73c5e2',
		    needle    : { start: '#a3a3a2', end: '#a3a3a2' }
	    },
        highlights : [{
            from  : 145,
            to    : 150,
            color : 'PaleGreen'
        }, {
            from  : 150,
            to    : 155,
            color : 'LightSalmon'
        }],
        animation : {
            delay : 10,
            duration: 300,
            fn : 'bounce'
        }
    });
        gauge.draw();

        return gauge;
    }

    function createPowerGauge(id)
    {
    var gauge = new Gauge({
        renderTo  : id,
        width     : 200,
        height    : 200,
        glow      : false,
        units     : '%',
        title     : 'Power',
        strokeTicks : false,
        minValue: 0,
        maxValue: 100,
	    colors: {
		    plate     : '#0a0a0a',
		    majorTicks: '#73c5e2',
		    minorTicks: '#73c5e2',
		    title     : '#888',
		    units     : '#888',
		    numbers   : '#73c5e2',
		    needle    : { start: 'rgba(240, 128, 128, 1)', end: 'rgba(255, 160, 122, .9)' }
	    },
        minorTicks  : 0,
	    majorTicks: ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
        highlights : false,
        animation : {
            delay : 10,
            duration: 300,
            fn : 'bounce'
        }
    });
        gauge.draw();
        return gauge;
    }

    preHeaterTempGauge = createTempGauge("preHeaterTempGauge", 0, 160, ['0', '20','40','60','80','100', '120', '140', '160']);
    preHeaterPowerGauge = createPowerGauge("preHeaterPowerGauge");

    mainHeaterTempGauge = createTempGauge("mainHeaterTempGauge", 0, 220, ['0', '20','40','60','80','100', '120', '140', '160', '170', '180', '190', '210', '220']);
    mainHeaterPowerGauge = createPowerGauge("mainHeaterPowerGauge");
});