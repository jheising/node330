head.ready(function()
{
	require(["dojox/charting/Chart", "dojox/charting/themes/Claro", "dojox/charting/themes/Tom", "dojo/store/Observable", "dojo/store/Memory",
	         "dojox/charting/StoreSeries", "dojox/charting/plot2d/Lines", "dojox/charting/axis2d/Default",
	         "dojox/charting/widget/SelectableLegend", "dojox/charting/action2d/Tooltip","dojox/charting/action2d/MouseZoomAndPan",
	         "dojo/domReady!"],
	function(Chart, Claro, Tom, Observable, Memory, StoreSeries, Lines, Default, SelectableLegend, Tooltip, MouseZoomAndPan)
	{
		var combinedChart;
		var combinedChartData;
		var combinedChartComponents = {};
		var combinedChartLegend;
		var combinedChartTooltip;
        var combinedChartZoomAndPan;

		function formatTimestamp(time)
		{
			var dt = new Date();
			dt.setTime(time);
			var d = (dt.getHours() + 1) + ":" + dt.getMinutes() + ":" + dt.getSeconds();
			return d;
		}

		function updateChart()
		{
			var now = Date.now();

			_.each(combinedChartComponents, function(component, componentName, list)
			{

				combinedChartData.notify({
					name : componentName,
					time : now,
					value: component.value()
				});

			});
		}

		function node330Component()
		{
			var self = this;

			this.name = ko.observable();
			this.display_name = ko.observable();
			this.type = ko.observable();
			this.read_only = ko.observable();
			this.value = ko.observable();
			this.units = ko.observable();
			this.description = ko.observable();
			this._graph = ko.observable(false);

			this.graph = ko.computed({
				read : function()
				{
					return self._graph();
				},
				write: function(value)
				{
					self._graph(value);

					if(value === true)
					{
						combinedChart.addSeries(self.display_name(), new StoreSeries(combinedChartData, { query: {name: self.name()} }, {x:"time", y:"value"}), {enableCache: true, marker: "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0"});
						combinedChartComponents[self.name()] = self;
						updateChart();
					}
					else
					{
						combinedChart.removeSeries(self.display_name());
						delete combinedChartComponents[self.name()];
					}

					combinedChart.render();
					combinedChartLegend.refresh();
				},
				owner: this
			});

			// Behaviors
			this.startEditing = function()
			{
				return true;
			}

			this.endEditing = function()
			{
				if(!this.read_only())
				{
					var value = this.value();

					if(this.type() == "SWITCH")
					{
						value = Number(value);
					}

					$.get("components/" + this.name() + "?set_value=" + value)
				}

				return true;
			}


		}

		function node330UIModel()
		{
			var self = this;

			self.components = ko.observableArray();

			self.loadJSONData = function(data)
			{

				// Loop through our input data and see if it matches to one of our components
				_.each(data, function(jsonValue, jsonKey, jsonList)
				{

					var component = ko.utils.arrayFirst(self.components(), function(item)
					{
						return (jsonKey === item.name());
					});

					if(_.isNull(component))
					{
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
				});
			}

            self.clearData = function()
            {
                if (confirm('Are you sure you want to clear the data from the graph?')) {
                    // Save it!
                } else {
                    // Do nothing!
                }
            }
		}

		// Create the data store
		// Store information in a data store on the client side
		combinedChartData = Observable(new Memory({
			data: {
				identifier: "time",
				label     : "Values"
			}
		}));

		combinedChart = new Chart("combinedChart");

		// Set the theme
		combinedChart.setTheme(Tom);

		// Add axes
		combinedChart.addAxis("x", { type: Default, labelFunc: function(text, value, precision)
		{
			return formatTimestamp(value);
		}});

		combinedChart.addAxis("y", { vertical: true});

        // Add the only/default plot
        combinedChart.addPlot("default", {
            type   : Lines,
            markers: true
        });

		combinedChartLegend = new SelectableLegend({
            chart: combinedChart,
            horizontal: true,
            region : "bottom"
        },
            dojo.byId("combinedChartLegend"));

		combinedChartTooltip = new Tooltip(combinedChart, Lines, {
			text: function(o)
			{
				var seriesName = o.run.source.series.name;
				return seriesName + "<br/>Time: " + formatTimestamp(o.x);
			}
		});

        combinedChartZoomAndPan = new MouseZoomAndPan(combinedChart, "default", { axis: "x" });

		// Render the chart!
		combinedChart.render();

        function resizeChart()
        {
            var chartContainer = $("#combinedChartContainer");

            combinedChart.resize(chartContainer.width(), 400);
        }

        $(window).resize(resizeChart);
        $('a[data-toggle="tab"]').on('shown', resizeChart);

		var uiModel = new node330UIModel();

		ko.applyBindings(uiModel);

		var uiUpdateTimer = setInterval(function()
		{
			// Get latest values
			$.getJSON('components', function(data)
			{
				uiModel.loadJSONData(data);
			});

		}, 1000);

		var chartUpdateTimer = setInterval(function()
		{
			updateChart();

		}, 5000);

		function createTempGauge(selector, min, max, greenline, redline)
		{

			var background = new RGraph.Drawing.Image(selector, 0, 0, 'img/temp-gauge-bg.png').Set('chart.width', 250).Set('chart.height', 250).Draw();

			var gauge = new RGraph.Gauge(selector, min, max, [0, 0
			]).Set('title', 'Temp').Set('title.top.size', 'Italic 10').Set('title.bottom', '°F').Set('title.bottom.color', '#73c5e2').Set('centerx', 125).Set('tickmarks.small.color', '#73c5e2').Set('tickmarks.big.color', '#73c5e2').Set('text.color', '#73c5e2').Set('needle.size',
					[null, 50]).Set('chart.needle.type', "line").Set('needle.colors', ['white', 'yellow'
				]).Set('radius', 100).Set('chart.green.end', greenline).Set('chart.red.start', redline).Set('chart.yellow.color', 'green').Set('background.color', 'transparent').Set('border.outer', 'transparent').Set('border.inner', 'transparent').Set('border.outline', 'transparent').Set('shadow', false).Set('centerpin.color', 'transparent').Set('centerpin.radius', 0).Draw();

			var overlay = new RGraph.Drawing.Image(selector, 0, 0, 'img/gauge-glass-overlay.png').Set('chart.width', 250).Set('chart.height', 250).Draw();

			return gauge;
		}

		function createPowerGauge(selector)
		{
			var background = new RGraph.Drawing.Image(selector, 0, 0, 'img/power-gauge-bg.png').Set('chart.width', 175).Set('chart.height', 175).Draw();

			var gauge = new RGraph.Gauge(selector, 0, 100, [0, 0
			]).Set('angles.start', PI).Set('angles.end', TWOPI).Set('title.bottom.color', '#73c5e2').Set('radius', 80).Set('centerx', 87).Set('tickmarks.small', 0).Set('colors.ranges',
					[
					]).Set('tickmarks.big', 0).Set('labels.count', 0).Set('text.color', '#73c5e2').Set('needle.type', "line").Set('needle.colors',
					['#000'
					]).Set('background.color', 'transparent').Set('border.outer', 'transparent').Set('border.inner', 'transparent').Set('border.outline', 'transparent').Set('shadow', false).Set('centerpin.color', 'transparent').Set('centerpin.radius', 0).Draw();

			var overlay = new RGraph.Drawing.Image(selector, 0, 0, 'img/power-gauge-overlay.png').Set('chart.width', 175).Set('chart.height', 175).Draw();

			return gauge;
		}

		/*preHeaterTemp = createTempGauge("preHeaterTemp", 130, 155, 145, 150);
		 preHeaterPower = createPowerGauge("preHeaterPower");
		 mainHeaterTemp = createTempGauge("mainHeaterTemp", 100, 220, 210, 212);
		 mainHeaterPower = createPowerGauge("mainHeaterPower");*/
	});
});