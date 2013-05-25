var palette = new Rickshaw.Color.Palette( { scheme: 'spectrum14' } );
var graphData = {};
var graph;
var graphUpdateInterval = 5000;
var graphLastUpdate = 0;

function node330Component() {
    this.name = ko.observable();
    this.type = ko.observable();
    this.read_only = ko.observable();
    this.value = ko.observable();
}

function node330UIModel() {
    var self = this;

    self.components = ko.observableArray();
    self.graphSeries = [];

    self.loadJSONData = function (data) {

        var now = new Date().getTime();
        var shouldUpdateGraph = false;

        if((now - graphLastUpdate) >= graphUpdateInterval)
        {
            shouldUpdateGraph = true;
            graphLastUpdate = now;
        }

        // Loop through our input data and see if it matches to one of our components
        _.each(data, function (jsonValue, jsonKey, jsonList) {

            var component = ko.utils.arrayFirst(self.components(), function (item) {
                return (jsonKey === item.name());
            });

            if (_.isNull(component))
            {
                component = new node330Component();
                self.components.push(component);
            }

            component.name(jsonKey);
            component.type(jsonValue.type);
            component.read_only(jsonValue.read_only);
            component.value(jsonValue.value);

            if(shouldUpdateGraph && jsonValue.read_only)
            {
                var series = _.findWhere(self.graphSeries, {name: jsonValue.display_name});

                if(_.isUndefined(series))
                {
                    series = {
                        name: jsonValue.display_name,
                        data: [],
                        color: palette.color()
                    };

                    self.graphSeries.push(series);
                }

                if(!_.isUndefined(graph) && _.isUndefined(series.hoverDetail))
                {
                    series.hoverDetail = new Rickshaw.Graph.HoverDetail( {
                        graph: graph,
                        yFormatter: function(y)
                        {
                            var type = component.type();

                            if(type == "TEMP_IN_C")
                            {
                                return y + " &deg;C";
                            }
                            else if(type == "TEMP_IN_F")
                            {
                                return y + " &deg;F";
                            }
                            else
                            {
                                return y;
                            }
                        }
                    });
                }

                series.data.push({x: Math.floor(now / 1000), y: jsonValue.value});
            }
        });
    }
}

head.ready(function () {
    var uiModel = new node330UIModel();

    ko.applyBindings(uiModel);

    var uiUpdateTimer = setInterval(function () {
        // Send back any non-readonly values
        for (var index = 0; index < uiModel.components().length; index++) {
            var component = uiModel.components()[index];

            if (!component.read_only()) {
                var value = component.value();

                if (component.type() == "SWITCH") {
                    value = Number(value);
                }

                $.get("components/" + component.name() + "?set_value=" + value)
            }
        }

        // Get latest values
        $.getJSON('components', function (data)
        {
            uiModel.loadJSONData(data);

            if(_.isUndefined(graph))
            {
                graph = new Rickshaw.Graph( {
                    element: document.getElementById("chart"),
                    renderer: 'line',
                    stroke: true,
                    preserve: true,
                    height: 250,
                    series: uiModel.graphSeries});

                graph.render();

                var slider = new Rickshaw.Graph.RangeSlider( {
                    graph: graph,
                    element: $('#slider')
                } );

                var legend = new Rickshaw.Graph.Legend( {
                    graph: graph,
                    element: document.getElementById('legend')
                } );

                var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
                    graph: graph,
                    legend: legend
                } );

                var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
                    graph: graph,
                    legend: legend
                } );

                var ticksTreatment = 'glow';

                var xAxis = new Rickshaw.Graph.Axis.Time( {
                    graph: graph,
                    ticksTreatment: ticksTreatment
                } );

                xAxis.render();


                var yAxis = new Rickshaw.Graph.Axis.Y( {
                    graph: graph,
                    tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
                    ticksTreatment: ticksTreatment
                } );

                yAxis.render();
            }

            graph.update();
        });

    }, 1000);
});