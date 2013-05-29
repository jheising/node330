var palette = new Rickshaw.Color.Palette({ scheme: 'colorwheel' });
var graphUpdateInterval = 5000;
var graphLastUpdate = 0;

var combinedGraph;
var combinedGraphSeries = [];
var preHeaterTemp, preHeaterPower, mainHeaterTemp, mainHeaterPower;

function createGraph(selectorPrefix, height, seriesData)
{
    var chartElement = document.getElementById(selectorPrefix + "Chart");
    var legendElement = document.getElementById(selectorPrefix + "Legend");
    chartElement.innerHTML = "";
    //chartElement.style = "";
    //chartElement.class = "";

    legendElement.innerHTML = "";
    //legendElement.style = "";
    //legendElement.class = "";

    if (_.isUndefined(seriesData))
    {
        return null;
    }

    var graph = new Rickshaw.Graph({
        element: chartElement,
        renderer: 'line',
        stroke: true,
        height: height,
        series: seriesData
    });

    graph.render();

    /*var slider = new Rickshaw.Graph.RangeSlider( {
     graph: graph,
     element: document.getElementById(selectorPrefix + 'Slider')
     } );*/

    var legend = new Rickshaw.Graph.Legend({
        graph: graph,
        element: legendElement
    });


    var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
     graph: graph,
     legend: legend
     } );

    var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
     graph: graph,
     legend: legend
     } );

    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph
    } );

    var ticksTreatment = 'glow';

    var xAxis = new Rickshaw.Graph.Axis.Time( {
     graph: graph,
     ticksTreatment: ticksTreatment
     } );

     xAxis.render();


    var yAxis = new Rickshaw.Graph.Axis.Y({
        graph: graph,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        ticksTreatment: ticksTreatment
    });

    yAxis.render();

    return graph;
}

function node330Component() {
    this.name = ko.observable();
    this.display_name = ko.observable();
    this.type = ko.observable();
    this.read_only = ko.observable();
    this.value = ko.observable();
    this.units = ko.observable();
    this.description = ko.observable();
    this._graph = ko.observable(false);

    this.graph = ko.computed({
        read: function ()
        {
            return this._graph();
        },
        write: function (value)
        {
            this._graph(value);

            var series = _.findWhere(combinedGraphSeries, {name: this.name()});

            if (value === true) {
                if (_.isUndefined(series)) {
                    series = {
                        name: this.display_name(),
                        color: palette.color(),
                        data: [
                            {x: 0, y: 0}
                        ]
                    };
                }

                combinedGraphSeries.push(series);
            }
            else
            {
                var index = combinedGraphSeries.indexOf(series);
                combinedGraphSeries.splice(index, 1);
            }

            if(_.isUndefined(combinedGraph))
            {
                combinedGraph = createGraph("combined", 300, combinedGraphSeries);
            }
            else
            {
                combinedGraph.update();
            }

        },
        owner: this
    });

    // Behaviors
    this.startEditing = function () {
    }

    this.endEditing = function () {
        if (!this.read_only()) {
            var value = this.value();

            if (this.type() == "SWITCH") {
                value = Number(value);
            }

            $.get("components/" + this.name() + "?set_value=" + value)
        }
    }


}

function node330UIModel() {
    var self = this;

    self.components = ko.observableArray();

    self.loadJSONData = function (data) {

        var now = new Date().getTime();
        var shouldUpdateGraph = false;

        if ((now - graphLastUpdate) >= graphUpdateInterval) {
            shouldUpdateGraph = true;
            graphLastUpdate = now;
        }

        var tmpValues = {};

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

            tmpValues[jsonValue.name] = component;

            if (shouldUpdateGraph) {
            }
            /*var series = _.findWhere(self.graphSeries, {name: jsonValue.display_name});

             if (_.isUndefined(series)) {
             series = {
             name: jsonValue.display_name,
             data: [],
             color: palette.color()
             };

             self.graphSeries.push(series);
             }

             if (!_.isUndefined(graph) && _.isUndefined(series.hoverDetail)) {
             series.hoverDetail = new Rickshaw.Graph.HoverDetail({
             graph: graph,
             yFormatter: function (y) {
             var type = component.type();

             if (type == "TEMP_IN_C") {
             return y + " &deg;C";
             }
             else if (type == "TEMP_IN_F") {
             return y + " &deg;F";
             }
             else {
             return y;
             }
             }
             });
             }

             series.data.push({x: Math.floor(now / 1000), y: jsonValue.value});
             }*/
        });


        preHeaterPower.value = tmpValues["preHeaterCV"].value() / 255 * 100;
        RGraph.Effects.Gauge.Grow(preHeaterPower);

        mainHeaterPower.value = tmpValues["sumpHeaterCV"].value() / 255 * 100;
        RGraph.Effects.Gauge.Grow(mainHeaterPower);

        preHeaterTemp.value = [tmpValues["preHeaterTemp"].value(), tmpValues["preHeaterSetPoint"].value()];
        RGraph.Effects.Gauge.Grow(preHeaterTemp);

        mainHeaterTemp.value = [tmpValues["sumpHeaterTemp"].value(), tmpValues["sumpHeaterSetPoint"].value()];
        RGraph.Effects.Gauge.Grow(mainHeaterTemp);
    }
}

head.ready(function () {
    var uiModel = new node330UIModel();

    ko.applyBindings(uiModel);

    var uiUpdateTimer = setInterval(function () {
        // Get latest values
        $.getJSON('components', function (data) {
            uiModel.loadJSONData(data);
        });

    }, 1000);

    function createTempGauge(selector, min, max, greenline, redline) {

	    var background = new RGraph.Drawing.Image(selector, 0, 0, 'img/temp-gauge-bg.png')
		    .Set('chart.width', 250)
		    .Set('chart.height', 250)
		    .Draw();

        var gauge = new RGraph.Gauge(selector, min, max, [0, 0])
            .Set('title', 'Temp')
            .Set('title.top.size', 'Italic 10')
            .Set('title.bottom', '°F')
            .Set('title.bottom.color', '#73c5e2')
            .Set('centerx', 125)
	        .Set('tickmarks.small.color', '#73c5e2')
	        .Set('tickmarks.big.color', '#73c5e2')
	        .Set('text.color', '#73c5e2')
            .Set('needle.size', [null, 50])
            .Set('chart.needle.type', "line")
            .Set('needle.colors', ['white', 'yellow'])
            .Set('radius', 100)
            .Set('chart.green.end', greenline)
            .Set('chart.red.start', redline)
            .Set('chart.yellow.color', 'green')
	        .Set('background.color', 'transparent')
	        .Set('border.outer', 'transparent')
	        .Set('border.inner', 'transparent')
	        .Set('border.outline', 'transparent')
	        .Set('shadow', false)
	        .Set('centerpin.color', 'transparent')
	        .Set('centerpin.radius', 0)
            .Draw();

	    var overlay = new RGraph.Drawing.Image(selector, 0, 0, 'img/gauge-glass-overlay.png')
		    .Set('chart.width', 250).Set('chart.height', 250)
		    .Draw();

        return gauge;
    }

    function createPowerGauge(selector) {
        var background = new RGraph.Drawing.Image(selector, 0, 0, 'img/power-gauge-bg.png')
		    .Set('chart.width', 175)
		    .Set('chart.height', 175)
		    .Draw();

        var gauge = new RGraph.Gauge(selector, 0, 100, [0, 0])
	        .Set('angles.start', PI)
	        .Set('angles.end', TWOPI)
            .Set('title.bottom.color', '#73c5e2')
	        .Set('radius', 80)
            .Set('centerx', 87)
	        .Set('tickmarks.small', 0)
	        .Set('colors.ranges', [])
	        .Set('tickmarks.big', 0)
	        .Set('labels.count', 0)
	        .Set('text.color', '#73c5e2')
            .Set('needle.type', "line")
	        .Set('needle.colors', ['#000'])
	        .Set('background.color', 'transparent')
	        .Set('border.outer', 'transparent')
	        .Set('border.inner', 'transparent')
	        .Set('border.outline', 'transparent')
	        .Set('shadow', false)
	        .Set('centerpin.color', 'transparent')
	        .Set('centerpin.radius', 0)
            .Draw();

	    var overlay = new RGraph.Drawing.Image(selector, 0, 0, 'img/power-gauge-overlay.png').Set('chart.width', 175)
		    .Set('chart.height', 175)
		    .Draw();

        return gauge;
    }

    preHeaterTemp = createTempGauge("preHeaterTemp", 130, 155, 145, 150);
    preHeaterPower = createPowerGauge("preHeaterPower");
    mainHeaterTemp = createTempGauge("mainHeaterTemp", 100, 220, 210, 212);
    mainHeaterPower = createPowerGauge("mainHeaterPower");
});