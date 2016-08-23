head.ready(function()
{

	var connected = false;
	var chart;

	function writeSetting(settingName, value)
	{
		if(_.isBoolean(value))
		{
			if(value === false)
			{
				value = 0;
			}
			else if(value === true)
			{
				value = 1;
			}
		}

		//$.get("/components/" + settingName + "?set_value=" + value);
		$.ajax({
			type : "POST",
			url : "/components/" + settingName,
			data : JSON.stringify({set_value : value}),
			contentType : "application/json",
		});
		/*$.post("/components/" + settingName, {
			set_value : value
		}, function(response) {
		}, 'json');*/
	}

	function formatTimestamp(time)
	{
		var dt = new Date();
		dt.setTime(time);
		var d = (dt.getHours() + 1) + ":" + dt.getMinutes() + ":" + dt.getSeconds();
		return d;
	}

	function isNumber(n)
	{
		return !isNaN(parseFloat(n)) && isFinite(n);
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
		this.graph = false;

		self.displayInfo = function(data, event)
		{
			$(event.target).popover({

			});
		}

		self.hideInfo = function(data, event)
		{

		}

		self.toggleGraph = function(data, event)
		{
			if(!isNumber(self.value()))
			{
				if(!self.graph)
				{
					return;
				}

				self.graph = false;
			}
			else
			{
				self.graph = !self.graph;
			}

			var buttonElement = $(event.currentTarget);
			buttonElement.find("i").toggleClass("icon-white", self.graph);


			if(self.graph)
			{
				self.series = chart.addSeries({
					marker: {
						enabled: false
					},
					name : self.display_name(),
					tooltip:
					{
						valueSuffix:self.units()
					}
				});

				self.series.setData([], false);

				var x = (new Date()).getTime();
				var y = self.value();

				self.series.addPoint([x, y], true);
			}
			else
			{
				self.series.remove();
				self.series = undefined;
			}
		}

        function finalizeValue()
        {
            self.oldValue = undefined;

            if(!self.read_only())
            {
                var value = self.value();

                if(self.type() == "SWITCH")
                {
                    value = Number(value);
                }

                writeSetting(self.name(), value);
            }
        }

		// Behaviors
		self.startEditing = function(item, event)
		{
            self.isEditing = true;
            self.oldValue = self.value();

            var element = $(event.target);
            element.width(element.width() - 43);

            self.saveEditButton = $('<button id="save-edit-button" class="btn btn-success"><i class="icon-white icon-ok"></i></button>').on("click", finalizeValue).insertAfter(element);

            element.on("keypress", function(e){

                var code = e.keyCode || e.which;
                if(code == 13) { // Enter key pressed
                    element.blur();
                    self.saveEditButton.trigger("click");
                }

            });

			return true;
		}

		self.endEditing = function(item, event)
		{
            if(self.type() == "SWITCH")
            {
                finalizeValue();
                return;
            }

            var element = $(event.target);

            element.off("keypress");

            setTimeout(function(){

                if(self.saveEditButton)
                {
                    self.saveEditButton.remove();
                    self.saveEditButton = undefined;
                }

                element.width(element.width() + 43);

                if(!_.isUndefined(self.oldValue))
                {
                    self.value(self.oldValue);
                }

                self.isEditing = false;

            }, 250);

			return true;
		}


	}

	function node330UIModel()
	{
		var self = this;

		self.components = ko.observableArray();
		self.latestData = undefined;

		self.getComponentNamed = function(name)
		{
			return _.find(self.components(), function(component)
			{

				return (component.name() === name);

			});
		}

		self.updateStartStopSwitch = function(state)
		{
			if(state)
			{
				$("#onOffSwitch").addClass("toggle-switch-on");
			}
			else
			{
				$("#onOffSwitch").removeClass("toggle-switch-on");
			}
		}

		self.startStop = function()
		{
			var startStopComponent = self.getComponentNamed("startStopSwitch");
			var state = !startStopComponent.value();

			writeSetting("startStopSwitch", state);
			self.updateStartStopSwitch(state);
		}

		self.loadJSONData = function(data)
		{
			self.latestData = data;

			var componentValues = {};

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

                if(!component.isEditing)
                {
				    component.value(jsonValue.value);
                }

				component.units(jsonValue.units);
				component.description(jsonValue.description);

				componentValues[jsonValue.name] = jsonValue.value;
			});
		}
	}

	var uiModel = new node330UIModel();

	ko.bindingHandlers.componentInfo = {
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {

			if(viewModel.name())
			{
				var loc = location.origin + "/components/" + viewModel.name();

				$(element).popover({
					placement : "bottom",
					title : viewModel.name(),
					html : true,
					content : "<pre>" + loc + "</pre>",
					trigger : "click"
				});
			}

		}
	};
	ko.applyBindings(uiModel);

	function getData()
	{
		// Get latest values
		// TODO remove hardcoded IP
		$.ajax({
			url     : '/components',
			dataType: 'jsonp'
		}).done(function(data)
			{

				if(!connected)
				{
					$('#connectionModal').modal('hide');
				}

				connected = true;

				uiModel.loadJSONData(data);
			}).fail(function()
			{

				connected = false;
				$('#connectionModal').modal({
					keyboard: false,
					backdrop: 'static'
				})

			});
	}

	getData();
	var uiUpdateTimer = setInterval(function()
	{
		getData();
	}, 1000);

	$(function()
	{
		$(".control-values").show();

		Highcharts.setOptions({
			global: {
				useUTC: false
			}
		});

		chart = new Highcharts.Chart({
			chart      : {
				backgroundColor : "black",
				zoomType   : 'x',
				renderTo   : 'graph-container',
				type       : 'line',
				marginRight: 10,
                reflow : true,
				events     : {
					load: function()
					{
						// set up the updating of the chart every 5 seconds
						var series = this.series;
						setInterval(function()
						{
							var x = (new Date()).getTime();

							_.each(uiModel.components(), function(component)
							{
								if(component.series)
								{
									var y = component.value();
									component.series.addPoint([x, y], true);
								}
							});

						}, 5000);
					}
				}
			},
			title      : {
				text: ''
			},
			xAxis      : {
				title: {
					text: "Time"
				},
				type: 'datetime',
				dateTimeLabelFormats: {
					millisecond: '%l:%M:%S %p',
					second: '%l:%M:%S %p',
					minute: '%l:%M %p',
					hour  : '%l:%M %p'
				},
				tickPixelInterval: 150
			},
			yAxis      : {
				title    : {
					text: ""
				},
                gridLineColor: '#1a1a1a',
				plotLines: [
					{
						value: 0,
						width: 1,
						color: '#808080'
					}
				]
			},
			tooltip:
			{
				xDateFormat: '%l:%M:%S %p'
			},
			plotOptions: {
				series: {
					marker: {
						enabled: false
					}
				}
			},
			legend     : {
				enabled: true
			},
			exporting  : {
				enabled: false
			}
		});

		$("#toggle_graph_button").click(function()
		{
			if($("#graph-container").is(':visible'))
            {
                $("#toggle_graph_button").text("Show Graph");
                $("#graph-container").hide();
            }
            else
            {
                $("#toggle_graph_button").text("Hide Graph");
                $("#graph-container").show();
                chart.setSize($('#graph-container').width(), 600, false);
            }
		});

		$("#reset_button").click(function()
		{
			var answer = confirm("Are you sure you want to delete this data?");

			if(answer)
			{
				_.each(chart.series, function(series)
				{
					series.setData([], true);
				});
			}
		});
	});
});