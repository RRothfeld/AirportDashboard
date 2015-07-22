/*!
 *  dc 2.1.0-dev
 *  http://dc-js.github.io/dc.js/
 *  Copyright 2012-2015 Nick Zhu & the dc.js Developers
 *  https://github.com/dc-js/dc.js/blob/master/AUTHORS
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**

The entire dc.js library is scoped under the **dc** name space. It does not introduce anything else
into the global name space.

#### Function Chaining
Most dc functions are designed to allow function chaining, meaning they return the current chart
instance whenever it is appropriate. This way chart configuration can be written in the following
style:
```js
chart.width(300)
    .height(300)
    .filter('sunday')
```
The getter forms of functions do not participate in function chaining because they necessarily
return values that are not the chart.
**/
var crosscompare = {
	height: 200, // default
	width: 'auto',
	anchor: '#crosscompare', // default
	flash: true,
	chart: {},
	charts: {}
};

crosscompare.setHeight = function(height) {
	if (height >= 0)
		this.height = height;
	return this;
};

crosscompare.setAnchor = function(anchor) {
	if (typeof anchor !== 'undefined' && anchor.length > 0)
		this.anchor = anchor;
	return this;
};

crosscompare.setFlash = function(active) {
	if (typeof active === 'boolean')
		this.flash = active;
	return this;
}

crosscompare.add = function(anchor, chart, type) {
	// add chart to charts with given name
	this.charts[anchor] = { 'chart': chart, 'type': type};

	// render crosscompare chart if anchor clicked
	$(anchor).on('click', function() {
		crosscompare.render(anchor);
	});

	return this;
};

crosscompare.reset = function() {
	this.chart.rendered.destroy();
	this.chart = {};
};

crosscompare.render = function(anchor) {

	// retrieve dc.js chart via its anchor
	var chart = this.charts[anchor].chart;
	var chartType = this.charts[anchor].type;

	// retrieve filter for naming the categorization
	//var name = chart.filters();
	var name = Math.random();

	// retrieve data filters and filter cache
	var filters = chart.filters()[0];

	// cache the charts underlying data (deep copy)
	var cache = $.extend(true, [], chart.group().all());

	// IF STACKED (CURRENTLY REMOVED)
	//console.log(chart.stack());

	$.each(cache, function(i, val) {
		if (typeof filters !== 'undefined' && // if there is a filter,
			((filters.length == 1 // check if single filter,
				&& val.key != filters[0]) // if data does not equal filter -> remove;
			|| (filters.length == 2 // check if range filter,
				&& (val.key < filters[0] || val.key > filters[1]) // if data out of range -> remove;
			))) {

			val[name] = null;
			delete val.value;

		} else {
			// in multi-value groups, read out correct value?  <------------------------------------
			val[name] = val.value;
			delete val.value;
		}
	});


	// flashing animation (10 ms -> 700 ms)
	if (this.flash)
		$(chart.anchor()).fadeTo(10, 0.3).fadeTo(700, 1.0);

	// if no chart rendered or chart rendered is not the one to be rendered
	if ($.isEmptyObject(this.chart) || this.chart.source != chart) {
		
		// fill active as to signal that a crosscompare has been created
		this.chart.source = chart;

		var options = {
			bindto: this.anchor,
			size: { height: this.height },
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			data: { json: cache, keys: { x: 'key', value: [name] }, types: { value: [name] } },
			zoom: { enabled: true, rescale: true },
		};

		if ( chartType == 'line') {
			options.axis = { x: { 
				type: 'timeseries',
				tick: { format: '%d.', fit: false },
				// TODO MAKE RESPONSIVE !!!! <-----------------------------------------------------
				max: new Date(2009,0,1),
				min: new Date(2008,11,30)
			} };
		} else if ( chartType == 'bar') {
			options.bar = { width: { ratio: 0.5 } };
			options.data.type = chartType;
			// Bar chart not always category  <-----------------------------------------------------
			// only if x is not a number
			// also if number --> x tick fit: false
			//options.axis = { x: { type: 'category' } };
		}

		// make available later (see below)
		this.chart.rendered = c3.generate(options);

	} else {

		//TODO UPDATE x-axis range <-----------------------------------------------------

		var options = {
			json: cache,
			keys: { x: 'key', value: [name] }
		};

		// if line, no change required, otherwise
		if (chartType != 'line')
			options.type = chartType;

		// load additional data
		this.chart.rendered.load(options);
	}
};

// Node.js export
if (typeof exports !== 'undefined'){ module.exports = crosscompare };