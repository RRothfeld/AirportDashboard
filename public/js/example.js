// Load data from csv file
//d3.csv("/data/flightsDec08.csv", function(data) {
d3.csv("/data/MINI.csv", function(data) {

	// Define charts
	var movementsChart = dc.lineChart('#movements-chart'),
			movementsTimeChart = dc.barChart('#movements-time-chart'),
			carrierChart = dc.barChart('#carrier-chart'),
			delayChart = dc.barChart('#delay-length-chart');

	// Parse dates and times from .csv
	var dateFormat = d3.time.format('%d-%m-%Y'),
			timeFormat = d3.time.format('%H:%M');

	data.forEach(function (d) {
		d.DDMMYYYY = dateFormat.parse(d.DDMMYYYY);
		d.ArrTimeRounded = timeFormat.parse(d.ArrTimeRounded);
		d.DepTimeRounded = timeFormat.parse(d.DepTimeRounded);
	});

	// Set up crossfilter
	var flights = crossfilter(data),
			all = flights.groupAll();

	// Define dimensions
	var date = flights.dimension(function(d) { return d.DDMMYYYY; }),
			airport = flights.dimension(function(d) { return d.Airport; }),
			delay = flights.dimension(function(d) { return d.ArrDelay; }),
			carrier = flights.dimension(function(d) { return d.Carrier; }),
			arrtime = flights.dimension(function(d) { return d.ArrTimeRounded; }),
			deptime = flights.dimension(function(d) { return d.DepTimeRounded; });

	// Define groups (reduce to counts)
	var byDate = date.group(),
			byAirport = airport.group(),
			byDelay = delay.group(),
			byCarrier = carrier.group();

	// Date range
	var minDate = date.bottom(1)[0].DDMMYYYY,
			maxDate = date.top(1)[0].DDMMYYYY;

	// Delay range
	var minDelay = -40,
			maxDelay = 90;

	dc.dataCount('.dc-data-count')
	.dimension(flights)
	.group(all)
	.html({
		some:'<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' + ' | <a href=\'javascript:dc.filterAll(); dc.redrawAll();\'\'>Reset All</a>',
		all:'All records selected. Please click on the graph to apply filters.'
	});

	// Define charts properties
	movementsChart
	.renderArea(true)
	.height(300)
	.margins({top: 10, right: 40, bottom: 30, left: 40})
	.dimension(date)
	.group(byDate)
	.elasticY(true)
	.x(d3.time.scale().domain([minDate, maxDate]))
	.renderHorizontalGridLines(true)
	.xUnits(d3.time.days)
	.mouseZoomable(true)
	.yAxis().ticks(7);

	movementsTimeChart
	.height(40)
	.margins({top: 0, right: 40, bottom: 20, left: 40})
	.dimension(date)
	.group(byDate)
	.centerBar(true)
	.elasticY(true)
	.x(d3.time.scale().domain([minDate, maxDate]))
	.xUnits(d3.time.days)
	.gap(1)
	.yAxis().ticks(0);

	carrierChart
	.height(300)
	.margins({top: 10, right: 70, bottom: 20, left: 30})
	.dimension(carrier)
	.group(byCarrier)
	.elasticY(true)
	.gap(1)
	.mouseZoomable(false)
	.x(d3.scale.ordinal())
	.xUnits(dc.units.ordinal);

	delayChart
	.height(250)
	.margins({top: 10, right: 50, bottom: 30, left: 50})
	.dimension(delay)
	.group(byDelay)
	.gap(1)
	.elasticY(true)
	.x(d3.scale.linear().domain([minDelay, maxDelay]))
	.renderHorizontalGridLines(true)
	.mouseZoomable(false)
	.yAxis().ticks(7);

	// Update chart widths
	renderCharts = function () {
		// Retrieve available space for charts via DOM
		var movementsChartWidth = $('#movements-chart-width').width(),
				carrierChartWidth = $('#carrier-chart-width').width(),
				delayChartWidth = $('#delay-length-chart-width').width();

		// Set chart widths
		movementsChart.width(movementsChartWidth);
		movementsTimeChart.width(movementsChartWidth)
		delayChart.width(delayChartWidth);

		// Render all charts (update)
		dc.renderAll();
	};

	// Render charts upon page load
	renderCharts();


	// JQUERY

	// Render charts upon page resize
	$(window).resize(function() {
		dc.filterAll(); // Reset filters as filters are not re-sizable
		renderCharts(); // Re-render charts
	});

	// Airport selection menu
	$('#airport-select').on('change', function() {
		airport.filter(this.value);
		dc.redrawAll();
	});

	var compChart, byDate2, byDate, date;
	var compareActive = false;
	var subCharts = [];
	var colors = ['orange','red','green','blue','brown'];
	var i = 0;
	// Graph test
	$('#test').on('click', function() {
		if (!compareActive) {
			compareActive = true;

			compChart = dc.compositeChart('#comparison-chart');

			// Set up crossfilter
			test = crossfilter(airport.top(Infinity));

			// Define dimensions
			date = test.dimension(function(d) { return d.DDMMYYYY; });

			// Define groups (reduce to counts)
			byDate = date.group();

			// Date range
			var minDate = date.bottom(1)[0].DDMMYYYY,
					maxDate = date.top(1)[0].DDMMYYYY;

			// Retrieve available space for charts
			var compChartWidth = $('#comparison-chart-width').width();

			subCharts = [];
			subCharts.push(dc.lineChart(compChart).group(byDate));

			// Define charts properties
			compChart
			.width(compChartWidth)
			.height(50)
			.margins({top: 0, right: 20, bottom: 1, left: 0})
			.dimension(date)
			.x(d3.time.scale().domain([minDate, maxDate]))
			.mouseZoomable(false)
			.brushOn(false)
			.elasticY(true)
			.compose(subCharts);

			// Render all charts
			compChart.render();
		} else {
			var test23 = crossfilter(airport.top(Infinity));
			date2 = test23.dimension(function(d) { return d.DDMMYYYY; });
			byDate2 = date2.group();

			subCharts.push(dc.lineChart(compChart).group(byDate2).colors(colors[i++]));
			i = i % colors.length;
		 	compChart
		 	.compose(subCharts);

			compChart.redraw();
		}
	});

	$('#reset-compare').on('click', function() {
		subCharts = [];
		compChart.compose(subCharts);
		compChart.render();

		compareActive = false;
	});

	// Graph test
	$('#test2').on('click', function() {

		console.log(airport.top(Infinity));

		var chart = c3.generate({
    bindto: '#comparison-chart',
    data: {
      columns: [
        ['data1', 30, 200, 100, 400, 150, 250],
        ['data2', 50, 20, 10, 40, 15, 25]
      ]
    }
});
	});


});