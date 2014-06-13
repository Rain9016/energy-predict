//some variables 
window.marker = new Array();
window.html = new Array();
var map;

// init code for google maps
function initMap(lat, lng, zoom) {   
    var mapOptions = {
        center: new google.maps.LatLng(lat, lng),
        zoom: zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);
    addMarkers('/sensors/sensorNodes');
}

function initialize() {
    var lat = 0, lng = 0;
    $.getJSON('/sensors/zoomCoordinates', function (data) {
        lat = data.lat; lng = data.lng;
        initMap(lat, lng, 10);        
        addFilters("SensorNode");
        addInfo("all");
    });    
    //histogramPlot();
}
//draw some charts
/*
function doChart(){
	var width = 960,
		height = 500;

	var y = d3.scale.linear()
		.range([height, 0]);

	var chart = d3.select(".chart")
		.attr("width", width)
		.attr("height", height);

	d3.tsv("data.tsv", type, function(error, data) {
	  y.domain([0, d3.max(data, function(d) { return d.value; })]);

	  var barWidth = width / data.length;

	  var bar = chart.selectAll("g")
		  .data(data)
		.enter().append("g")
		  .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; });

	  bar.append("rect")
		  .attr("y", function(d) { return y(d.value); })
		  .attr("height", function(d) { return height - y(d.value); })
		  .attr("width", barWidth - 1);

	  bar.append("text")
		  .attr("x", barWidth / 2)
		  .attr("y", function(d) { return y(d.value) + 3; })
		  .attr("dy", ".75em")
		  .text(function(d) { return d.value; });
	});

}
*/
/*
function chartWithTime(){

	var n = 243,
	    duration = 750,
	    now = new Date(Date.now() - duration),
	    count = 0,
	    data = d3.range(n).map(function() { return 0; });

	var margin = {top: 6, right: 0, bottom: 20, left: 40},
	    width = 960 - margin.right,
	    height = 120 - margin.top - margin.bottom;

	var x = d3.time.scale()
	    .domain([now - (n - 2) * duration, now - duration])
	    .range([0, width]);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var line = d3.svg.line()
	    .interpolate("basis")
	    .x(function(d, i) { return x(now - (n - 1 - i) * duration); })
	    .y(function(d, i) { return y(d); });

	var svg = d3.select(".chartsTime").append("p").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .style("margin-left", -margin.left + "px")
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append("defs").append("clipPath")
	    .attr("id", "clip")
	  .append("rect")
	    .attr("width", width)
	    .attr("height", height);

	var axis = svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(x.axis = d3.svg.axis().scale(x).orient("bottom"));

	var path = svg.append("g")
	    .attr("clip-path", "url(#clip)")
	  .append("path")
	    .data([data])
	    .attr("class", "line");

	tickWithTime(x, y, data, n, duration, svg, line, axis, path);
}
var count = 0;
d3.select(window)
    .on("scroll", function() { ++count; });
function tickWithTime(x, y, data, n, duration, svg, line, axis, path) {

  // update the domains
  now = new Date();
  x.domain([now - (n - 2) * duration, now - duration]);
  //console.log(JSON.stringify(x));
  y.domain([0, d3.max(data)]);

  // push the accumulated count onto the back, and reset the count
  data.push(Math.min(30, count));
  count = 0;

  // redraw the line
  svg.select(".line")
      .attr("d", line)
      .attr("transform", null);

  // slide the x-axis left
  axis.transition()
      .duration(duration)
      .ease("linear")
      .call(x.axis);

  // slide the line left
  path.transition()
      .duration(duration)
      .ease("linear")
      .attr("transform", "translate(" + x(now - (n - 1) * duration) + ")")
      .each("end", tickWithTime(x, y, data, n, duration, svg, line, axis, path));

  // pop the old data point off the front
  data.shift();

} */

var n = 400,
random = function(){ return 0;};
function chart(domain, interpolation, tick, divName) {
	var data = d3.range(n).map(random);
	var data2 = d3.range(n).map(random);
	var now = new Date();
	
	var margin = {top: 6, right: 0, bottom: 6, left: 40},
	width = 960 - margin.right,
	height = 120 - margin.top - margin.bottom;
	
	var x = d3.scale.linear()
	.domain(domain)
	.range([0, width]);
	
	var y = d3.scale.linear()
	.domain([-1, 10])
	.range([height, 0]);
    
    /*var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");*/

	var line = d3.svg.line()
	.interpolate(interpolation)
	.x(function(d, i) { return x(i); })
	.y(function(d, i) { return y(d); });

	var line2 = d3.svg.line()
	.interpolate(interpolation)
	.x(function(d, i) { return x(i); })
	.y(function(d, i) { return y(d); });
	
	var svg = d3.select("." + divName).append("p").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.style("margin-left", -margin.left + "px")
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	svg.append("defs").append("clipPath")
	.attr("id", "clip")
	.append("rect")
	.attr("width", width)
	.attr("height", height);
	
	svg.append("g")
	.attr("class", "y axis")
	.call(d3.svg.axis().scale(y).ticks(5).orient("left"));

	/*var axis = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(x.axis = d3.svg.axis().scale(x).orient("bottom"));*/
	
	var path = svg.append("g")
	.attr("clip-path", "url(#clip)")
	.append("path")
	.data([data])
	.attr("class", "line")
	.attr("d", line);
	
	if(divName == 'charts2')
		var lineName = "line3";
	else if(divName == 'charts3')
		var lineName = "line4";
	else
		var lineName = "line2";

	var path2 = svg.append("g")
	.attr("clip-path", "url(#clip)")
	.append("path")
	.data([data2])
	.attr("class", lineName)
	.attr("d", line2);
	
	tick(path, path2, line, line2, data, data2, x);
} 
var idStored = 0;
//draw some more streaming charts
function doCharts(divName){
	chart([1, n - 2], "basis", function tick(path, path2, line, line2, data, data2, x) {
    	//$.getJSON('/sensors/queryLastMeasurementAndPredict?data={"$join":{"$name":"measured","$query":{"$from":"SensorType","Name":"wind_direction"}}}', function (data3) {     
    	$.getJSON('/sensors/queryLastMeasurementAndPredict', function (data3) {     
	            	//data.push(data[0].value);
	            	oneValue = data3[0].value;
					data.push(oneValue);   
					now = new Date(data3[0].time) 	
  					//x.domain([now - (n - 2) * 750, now - 750]);					//$("#oneValue").html(oneValue);
					$("#oneValue").html(JSON.stringify(data3));
					// push a new data point onto the back

					// redraw the line, and then slide it to the left
					path
					.attr("d", line)
					.attr("transform", null)
					.transition()
					.duration(750)
					.ease("linear")
					.attr("transform", "translate(" + x(0) + ")")
					// pop the old data point off the front
					data.shift();

				    // slide the x-axis left
				    /*axis.transition()
				        .duration(750)
				        .ease("linear")
						//.attr("transform", "translate(" + x(0) + ")")
				        .call(x.axis);
*/
					if(divName == 'charts2')
	           			oneValue2 = data3[0].pred_value_weather_solar;
					else if(divName == 'charts3')
	           			oneValue2 = data3[0].pred_value_weather_temp;
	           		else
	           			oneValue2 = data3[0].pred_value;
					data2.push(oneValue2);    	
					//$("#oneValue").html(JSON.stringify(oneValue));
					//$("#oneValue").html(oneValue2);
					// push a new data point onto the back

					// redraw the line, and then slide it to the left
					path2
					.attr("d", line2)
					.attr("transform", null)
					.transition()
					.duration(750)
					.ease("linear")
					/*.attr("transform", "translate(" + x(now - (n - 1) * 750) + ")")*/.attr("transform", "translate(" + x(0) + ")")
					.each("end", function() { tick(path, path2, line, line2, data, data2, x); });
					// pop the old data point off the front
					data2.shift();
		}); 
	}, divName);
}

function timechart(domain, interpolation, ttick, divName) {
	var data = d3.range(n).map(function() {return [0,new Date('2013-05-01T07:07:00')]; });
	var data2 = d3.range(n).map(function() {return [0,new Date('2013-05-01T07:07:00')]; });
	var duration  = 6000000;
	var now = new Date(new Date('2013-05-01T07:07:00') - duration);

	var margin = {top: 6, right: 0, bottom: 20, left: 40},
	width = 960 - margin.right,
	height = 120 - margin.top - margin.bottom;
	
	//X axis
	var x = d3.time.scale()
		.domain([now - duration, now])
		.range([0, width]);
	
	var y = d3.scale.linear()
		//.domain([-1, 10])
		.range([height, 0]);
    
    /*var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");*/

	var line = d3.svg.line()
		.interpolate(interpolation)
		.x(function(d, i) {  return x(new Date(d[1])); })
		.y(function(d, i) {  return y(d[0]); });

	var line2 = d3.svg.line()
		.interpolate(interpolation)
		.x(function(d, i) { return x(new Date(d[1])); })
		.y(function(d, i) { return y(d[0]);});

	var svg = d3.select("." + divName).append("p").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.style("margin-left", -margin.left + "px")
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	svg.append("defs").append("clipPath")
		.attr("id", "clip")
	  .append("rect")
		.attr("width", width)
		.attr("height", height);
	
	var yaxis = svg.append("g")
		.attr("class", "y axis")
		.call(d3.svg.axis().scale(y).ticks(10).orient("left"));

	var axis = svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(x.axis = d3.svg.axis().scale(x).orient("bottom").ticks(5).tickFormat(d3.time.format("%d-%m-%Y %H:%M")));

	var path = svg.append("g")
		.attr("clip-path", "url(#clip)")
	  .append("path")
		.data([data])
		.attr("class", "line")
		.attr("d", line);
	
	if(divName == 'charts2')
		var lineName = "line3";
	else if(divName == 'charts3')
		var lineName = "line4";
	else if(divName == 'charts4')
		var lineName = "line5";
	else
		var lineName = "line2";

	var path2 = svg.append("g")
		.attr("clip-path", "url(#clip)")
	  .append("path")
		.data([data2])
		.attr("class", lineName)
		.attr("d", line2);

	// Y axis label
	yaxis.append("text")
		.attr("transform", "rotate(-90),translate(-250,-40)")
		.text("Interactions Per Second");


	
	ttick(path, path2, line, line2, data, data2, x, y, axis, yaxis);
} 
var idStored = 0;
//draw some more streaming charts
function doTimeCharts(divName){
	timechart([1, n - 2], "basis", function ttick(path, path2, line, line2, data, data2, x, y, axis, yaxis) {
    	//$.getJSON('/sensors/queryLastMeasurementAndPredict?data={"$join":{"$name":"measured","$query":{"$from":"SensorType","Name":"wind_direction"}}}', function (data3) {     
    	$.getJSON('/sensors/queryLastMeasurementAndPredict', function (data3) {     
            	//data.push(data[0].value);
            	var oneValuez = [];
            	var oneValue2 = [];
            	oneValuez[0] = data3[0].value;
				now = new Date(data3[0].time); 	
				oneValuez[1] = new Date(data3[0].time); 	
				if(oneValuez[1].getTime() != data[data.length-1][1].getTime()){
					data.push(oneValuez);  
					timeData = []; 
					now = new Date(data3[0].time); 	

					duration = 60000000;

					if(divName == 'charts2')
	           			oneValue2[0] = data3[0].pred_value;
					else if(divName == 'charts3')
	           			oneValue2[0] = data3[0].pred_value_fctemp_solar_autoreg;
					else if(divName == 'charts4')
	           			oneValue2[0] = data3[0].pred_value_fctemp_solar;
	           		else
	           			oneValue2[0] = data3[0].pred_value_fctemp_solar;
	           		oneValue2[1] = oneValuez[1];
  					//x.domain([now - (n - 2) * 750, now - 750]);					//$("#oneValue").html(oneValue);
					$("#oneValue").html("Real value: " + data3[0].value + 
						" | Predicted value (sensor): " + data3[0].pred_value.toFixed(2) + 
						" | Predicted value (angles + fctemp + autoreg): " + data3[0].pred_value_fctemp_solar_autoreg.toFixed(2) +
						" | Predicted value (angles + fctemp): " + data3[0].pred_value_fctemp_solar.toFixed(2) +
						"<br> Predicted value (sensor + Temp): "
						);
					// push a new data point onto the back

					y.domain([0, 14/*d3.max(data2)*/])
					x.domain([now - duration, now - 120*1000]);					

					// redraw the line, and then slide it to the left
					path.attr("d", line)
						.attr("transform", null)
						.transition()
						.duration(0)
						.ease("linear")
						.attr("transform", "translate(" + x(data3[0][1]) + ")")
					
					//console.log(x(now - (n - 1) * duration+500000000));
					//console.log(now - (n - 1) * duration);
					//console.log(x(now-3000000));
					//console.log(data2.length);

					/*console.log(x(now - (n - 1) * duration));
					console.log(now);
					console.log(x.domain);
					console.log(x(now));*/
					// pop the old data point off the front
					data.shift();

				    // slide the x-axis left
				    axis.transition()
				        .duration(0)
				        .ease("linear")
						//.attr("transform", "translate(" + x(0) + ")")
				        .call(x.axis);

					data2.push(oneValue2);    	
					

						// Y Axis
					yaxis.transition()
						.attr("class", "y axis")
						.ease("linear")
						.call(d3.svg.axis().scale(y).ticks(10).orient("left"));

					//$("#oneValue").html(JSON.stringify(oneValue));
					//$("#oneValue").html(oneValue2);
					// push a new data point onto the back

					// redraw the line, and then slide it to the left
					path2
						.attr("d", line2)
						.attr("transform", null)
						.transition()
						.duration(0)
						.ease("linear")
						.attr("transform", "translate(" + x(data3[0][1]) + ")")
						.each("end", function() { ttick(path, path2, line, line2, data, data2, x, y, axis, yaxis); });
					// pop the old data point off the front
					data2.shift();
				}
				else{
					setTimeout(function(){ttick(path, path2, line, line2, data, data2, x, y, axis, yaxis)},250);
					//setTimeout(function(){alert("Hello")},3000);
				}
		}); 
	}, divName);
}

//draw a histogram

function histogramPlot(){
	var nTicks = 0;
	$.getJSON('/sensors/query_boss_aggr?dataS={"$join":{"$name":"measured","$query":{"$from":"SensorType","Name":"wind_direction"}}}&dataAgg={"name":"Value","type":"histogram","field":"Value"}', function (dataRec) {     
		
		var data = [];
		var dataxValsMin = [];
		var dataxValsMax = [];

		dataRec.values.forEach(function(d, i){ 
			data.push(d.frequency);
			dataxValsMin.push(d.min); 
			dataxValsMax.push(d.max); 
		});
		
		console.debug(data);
		
		var margin = {top: 20, right: 20, bottom: 30, left: 40},
    		width = 480 - margin.left - margin.right,
    		height = 300 - margin.top - margin.bottom;

		var x = d3.scale.linear()
		    .domain([dataRec.min, dataRec.max])
		    .range([0, width]);
    	//var x = d3.scale.linear()
    	//	.domain([dataRec.min, dataRec.max]);
		
		var y = d3.scale.linear()
			.domain([0, d3.max(data, function(d) { return d; })])		
			.range([height, 0]);
		
		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
    		.orient("left")
    		.ticks(10, "");

		var chart = d3.select(".histogram")
    		.attr("width", width + margin.left + margin.right)
    		.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		
		var barWidth = (width) / data.length;

		var bar = chart.selectAll("g")
        	.data(data)
    	  .enter().append("g")
      		.attr("transform", function(d, i) { return "translate(" + x(dataxValsMin[i]) + ",0)"; });

      	chart.append("g")
      		.attr("class", "x axis")
      		.attr("transform", "translate(0," + height + ")")
      		.call(xAxis);
		
		chart.append("g")
		    .attr("class", "y axis")
		    .call(yAxis)
	    .append("text")
	    	.attr("transform", "rotate(-90)")
	    	.attr("y", 6)
	    	.attr("dy", ".71em")
	    	.style("text-anchor", "end")
	    	.text("Frequency");

	  	bar.append("rect")
  			.attr("y", function(d) { return y(d); })
      		.attr("height", function(d) { return height - y(d); })
      		.attr("width", barWidth-1);

	  	bar.append("text")
		  	.attr("x", barWidth / 2)
	  		.attr("y", function(d) { 
	  			var moveOutside = 0;
	  			(y(d) > (height - 14)) ? moveOutside = 15 : moveOutside = 0;
	  			return y(d)+4-moveOutside; 
	  		})
		    .attr("class", function(d) { 
	  			var addclass = "";
	  			(y(d) > (height - 14)) ? addclass = "black" : addclass = "";
	  			return "bartext " + addclass; 
	  		})
		  	.attr("dy", ".75em")
		  	.text(function(d) { return d; });
			//TODO: Label the x axis!!!!!!!!!!!!!!!!!
		/*
		
		nTicks = dataRec.values.length;
		// Generate a Bates distribution of 10 random variables.
		var values = d3.range(1000).map(d3.random.bates(10));
		console.debug(values);
		// A formatter for counts.
		var formatCount = d3.format(",.0f");
			console.debug(nTicks);
		var margin = {top: 10, right: 30, bottom: 30, left: 30},
			width = 960 - margin.left - margin.right,
			height = 500 - margin.top - margin.bottom;

		var x = d3.scale.linear()
			.domain([0, 1])
			.range([0, width]);

		// Generate a histogram using twenty uniformly-spaced bins.
		var data = d3.layout.histogram()
			.bins(x.ticks(nTicks))
			(values);

		var y = d3.scale.linear()
			.domain([0, d3.max(data, function(d) { return d.y; })])
			.range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var svg = d3.select(".histogram").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var bar = svg.selectAll(".bar")
			.data(data)
		  .enter().append("g")
			.attr("class", "bar")
			.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

		bar.append("rect")
			.attr("x", 1)
			.attr("width", x(data[0].dx) - 1)
			.attr("height", function(d) { return height - y(d.y); });

		bar.append("text")
			.attr("dy", ".75em")
			.attr("y", 6)
			.attr("x", x(data[0].dx) / 2)
			.attr("text-anchor", "middle")
			.text(function(d) { return formatCount(d.y); });

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);*/
	}); 

	
}
function tick() {
 
	// push a new data point onto the back
	data.push(random());
	 
	// redraw the line, and slide it to the left
	path
	.attr("d", line)
	.attr("transform", null)
	.transition()
	.duration(500)
	.ease("linear")
	.attr("transform", "translate(" + x(-1) + ",0)")
	.each("end", tick);
	 
	// pop the old data point off the front
	data.shift();
}

function type(d) {
  d.value = +d.value; // coerce to number
  return d;
}

//hack to make google maps work with twitter boostrap (take this out and map doesn't render)
$(window).resize(function () {
    var h = $(window).height(),
        offsetTop = 60; // Calculate the top offset

    $('#map-canvas').css('height', (h - offsetTop));
}).resize();

//populate the map and add listeners to the markers
function addMarkers(resource) {
    for (var i = 0; i < window.marker.length; i++) {
        window.marker[i].setVisible(false);
    }
    window.marker = new Array();
    var i = 0;
    $.getJSON(resource, function (data) {
        var items = [];
        //alert(data.length);
        $.each(data, function (key, val) {
            var point = new google.maps.LatLng(
                parseFloat(val.location[0]),
                parseFloat(val.location[1]));

            var icon;
            if (val.status == "Running") {
                icon = "http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png";
            } else {
                icon = "http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png";
            }

            window.marker[i] = new google.maps.Marker({
                map: map,
                position: point,
                icon: icon
            });
            google.maps.event.addListener(window.marker[i], 'click', function () {                
                initMap(parseFloat(val.location[0]), parseFloat(val.location[1]), 12);                
            });
            i++;
        });
    });
}

function addFilters(storeNm) {    
    var html = "";
    $.getJSON('/sensors/keys?store=' + storeNm, function (data) {       
        $.each(data, function (key, val) {           
            html += generateSelect(storeNm, val.name, val.voc);
        });
        html = '<div class="row"><div class="span12">' + html;        
        html = html + '</div></div>';
        //alert(html);
        $("#filters").append(html);
    });    
}

function generateSelect(storeNm, key, keywords) {
    var html = '<div class="span3"><label name = "filterLabels" value = "' + key + '">' + storeNm + ":" + key + '</label>';
    html += "<select name = 'filter' data-store = '" + storeNm + "'>";
    html += "<option>All</option>";
    for (var i = 0; i < keywords.length; i++) { 
        html += '<option value = "' + keywords[i] + '">' + keywords[i] + '</option>';
    }
    html += "</select></div>";   
    return html;
}

function addInfo(type) {    
    if (type == "all") {        
        $.getJSON('/sensors/allSensorsInfo', function (data) {           
            $("#info").append(data.text);                        
            //TODO most frequently accessed/used nodes
        });       
        //addTagCloud("SensorNode", "Name");
        //tagCloudOK();
    }
}

function doFilter() {
    var labels = document.getElementsByName("filterLabels");    
    var filters = document.getElementsByName("filter");
    var query = {}; query["$from"] = "SensorNode";
    for (var fId = 0; fId < filters.length; fId++) {
        var select = filters[fId];
        
        console.log(select.value);  
         
        if (select.value != "All") {
            var key = labels[fId].getAttribute("value");
            var val = select.value;
            query[key] = val;
        }
        else{
			
        }
    }
    var args = JSON.stringify(query); 
    console.log(args);
    addMarkers('/sensors/filter?filter=' + args);
}
/*function addTagCloud(storeNm, keyNm) {
    var html = "";
    $.getJSON('/sensors/key?store=' + storeNm + '&key=' + keyNm, function (data) {
        $.each(data, function (key, val) {                        
            html = html + "<li><a href=\"#\" data-weight=\"" + val.fq.toString() + "\" >" + val.key + "</a></li>";
        });
        $("#weightTags").append(html);
        initTagCloud();
    });    
}

function tagCloudOK() {
    $(document).ready(function () {
        if (!$('#tagcanvas').tagcanvas({
            textColour: '#ffffff',
            outlineThickness: 1,
            maxSpeed: 0.001,
            depth: 0.75
        })) {
            // TagCanvas failed to load
            $('#myCanvasContainer').hide();
        }
    });
}

function initTagCloud() {
    TagCanvas.interval = 20;
    TagCanvas.textFont = 'Impact,Arial Black,sans-serif';
    TagCanvas.textColour = '#00f';
    TagCanvas.textHeight = 25;
    TagCanvas.outlineColour = '#f96';
    TagCanvas.outlineThickness = 5;
    TagCanvas.maxSpeed = 0.02;
    TagCanvas.minBrightness = 0.1;
    TagCanvas.depth = 0.92;
    TagCanvas.pulsateTo = 0.2;
    TagCanvas.pulsateTime = 0.75;
    TagCanvas.initial = [0.1, -0.1];
    TagCanvas.decel = 0.98;
    TagCanvas.reverse = true;
    TagCanvas.hideTags = false;
    TagCanvas.shadow = '#ccf';
    TagCanvas.shadowBlur = 3;
    TagCanvas.weight = true;
    TagCanvas.weightFrom = 'data-weight';
    try {
        TagCanvas.Start('tagcanvas', 'weightTags', 'weightTags');
    } catch (e) {
    }
}*/
