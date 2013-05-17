var margin = {top: 20, right: 20, bottom: 40, left: 40},
    width = 1000 - margin.left - margin.right,
    height = 540 - margin.top - margin.bottom,
	chartheight = 250 - margin.top - margin.bottom,
  	code = "",
		path = d3.geo.path(),
		names = [];

var x0 = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var x1 = d3.scale.ordinal();

var y = d3.scale.linear()
    .range([chartheight, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x0)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".0%"));





 
queue()
  .defer(d3.json, "us-10m.json")
  .defer(d3.csv, "asthma.csv")
	.defer(d3.tsv, "us-state-names.tsv")
  .await(ready);
  

function ready(error, us, asthmadata, statenames) {

var svgChart = d3.select("body")
	.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", chartheight + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var quantize = d3.scale.quantize()

//make a dropdown menu with the parameters as options
var select = d3.select(".dropdown").append("select");  

	var params = d3.keys(asthmadata[0]).filter(function(key) { return key !== "State"; });
  asthmadata.forEach(function(d) {
    d.rate = params.map(function(name) { return {name: name, value: +d[name]}; });
  });
	console.log(params);
  x0.domain(asthmadata.map(function(d) { return d.State; }));
  x1.domain(params).rangeRoundBands([0, x0.rangeBand()]);
  y.domain([0, d3.max(asthmadata, function(d) { return d3.max(d.rate, function(d) { return d.value; }); })]);
	


select.selectAll("option")
	.data(params)
 .enter().append("option")
	.attr("value", function(d,i){return i;})
	.text(function(d){return d;});

select.on("change",function(){
	var parameter = this.selectedIndex; //this.selectedIndex returns a number which corresponds to the parameter array above
	updateMap(parameter);
	updateMapLegend(parameter);
	change(parameter);
});

var svgMap = d3.select(".map").append("svg");
	svgMap.attr("width", width)
	.attr("height", height);
	

  var responseData = {};
  var predictedData = {};
  var differenceData = {};
  var stateData = {};
  var dataArray=new Array(3);

//embarassing hack. there has got to be a better way to do this.
//loop to create an array (dataArray) that has 3 arrays, each representing one of the parameters for ach state (predicted, response, difference)   
for (idx=0;idx<3;idx++){

  dataArray[idx]= new Array(51);
  asthmadata.forEach(function(d,i){  
    responseData[getStateID(d.State)] = +d.Response;
    predictedData[getStateID(d.State)] = +d.Predicted;
    differenceData[getStateID(d.State)] = +d.Difference;
    stateData[getStateID(d.State)]=[responseData[getStateID(d.State)],predictedData[getStateID(d.State)],differenceData[getStateID(d.State)]];    
    dataArray[idx][i]={State: getStateID(d.State), value: stateData[getStateID(d.State)][idx]};
  
	});
}

	var g = svgMap.append("g")
		.attr("class", "states")
		.attr("id", "map")

  
  updateMap(0);
	updateMapLegend(0);
	change(0);

  function updateMap(parameter){

	  var r;
	  statenames.forEach(function(d){
		  names[d.id] = d.name;
		});
	  console.log(names);
		asthmadata.forEach(function(d,i){
			r=dataArray[parameter][i].value*100; //no more if/then statements!
			names[getStateID(d.State)] = names[getStateID(d.State)] + ": " + r.toFixed(1) + "%";
	  });
	  console.log(names);

//change the domain of the quantize function to match the min and max of the data for the given parameter
	quantize.domain(
		[d3.min(dataArray[parameter], function(d,i){return dataArray[parameter][i].value;}),
		d3.max(dataArray[parameter], function(d,i){return dataArray[parameter][i].value;})]
	);
		quantize.range(d3.range(9).map(function(i) { return "q"+ parameter + i + "-9"; }));

	g.selectAll("path").remove();

	var paths = g.selectAll("path")
		.data(topojson.object(us, us.objects.states).geometries)
	 .enter().append("path")
		.attr("class", function(d,i){return quantize( dataArray[parameter][i].value );})
		.attr("d", path)
		.on("mouseover",showCaption)
		.on("mouseout",function(){caption.html(starter);});
		}; 
  
  function updateMapLegend(parameter){

		//compute the min-max range for each quanta, and store the results in an array
		var quanta = quantize.range().length;
		var quantaValues = new Array(quanta);
		for (idx=0;idx<quanta;idx++){
			quantaValues[idx] = {
				min: (quantize.domain()[0] + idx*((quantize.domain()[1] - quantize.domain()[0])/(quanta-1))),
				max: (quantize.domain()[0] + (idx+1)*((quantize.domain()[1] - quantize.domain()[0])/(quanta-1)))
			}
		}
		
		//clear the legend (I think there is a better way to do this with .exit()
		svgMap.selectAll(".legend").remove();
	
		//draw the new legend by appending "quanta" number of g elements, each translated 25px down from the last
		var legend = svgMap.selectAll(".legend");
		
		legend.data(quantaValues)
		 .enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) {return "translate(0," + ((i * 25) + 25) + ")"; });
			
		//draw the boxes in each g, and give them the correct class to turn the right color
     svgMap.selectAll(".legend").append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .attr("class", function(d){return quantize(d.min);})
			.style("stroke","#000");
		
		//append the text labels to the g elements
    svgMap.selectAll(".legend").append("text")
			.attr("x", width - 21)
			.attr("y", 9)
			.attr("dy", ".4em")
			.attr("font-family", "sans-serif")
      .style("text-anchor", "end")
			.style("fill", "#000")
      .text(function(d) { return (d.min*100).toFixed(1) + "% - " + (d.max*100).toFixed(1) + "%"; });
			
		// change the legend title depending on the parameter being displayed
		svgMap.append("text")
			.classed("legend", true) //class as legend so it gets removed on update
			.attr("transform", "translate(0,12)")
			.attr("x",width-18)
			.attr("y", 0)
			.attr("dy", ".4em")
			.attr("font-family", "sans-serif")
			.style("text-anchor", "end")
			.text(params[parameter]);
  };

	//////////////////////////////////////////////////////////////////////////////////////
	////                                                                           ///////
	////                             BARCHART                                      ///////
	////                                                                           ///////
	//////////////////////////////////////////////////////////////////////////////////////
	
  svgChart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chartheight + ")")
      .call(xAxis);

  svgChart.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Prevalence");

  var state = svgChart.selectAll(".state")
      .data(asthmadata)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { return "translate(" + x0(d.State) + ",0)"; });

  state.selectAll("rect")
      .data(function(d) { return d.rate; })
    .enter().append("rect")
      .attr("width", x1.rangeBand())
      .attr("x", function(d) { return x1(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return chartheight - y(d.value); })
      .style("fill", function(d) { return color(d.name); });

  var sortTimeout = setTimeout(function() {
    d3.select("input").property("checked", true).each(change);
  }, 2000);

  var legend = svgChart.selectAll(".legend")
      .data(params.slice().reverse())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", 80)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", 74)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
	  
	function getStateID(statecode){
	statenames.forEach(function(d){
        if(d.code==statecode){id = d.id;}
    });
    return id;
  }
	  
  function change(parameter) {
    // Copy-on-write since tweens are evaluated after a delay.
	if (parameter==0){
		var x2 = x0.domain(asthmadata.sort(function(a, b) { return a.Response - b.Response; })
			.map(function(d) { return d.State; }))
			.copy();
	}else if (parameter==1){
		var x2 = x0.domain(asthmadata.sort(function(a, b) { return a.Predicted - b.Predicted; })
			.map(function(d) { return d.State; }))
			.copy();
	}else if (parameter==2){
		var x2 = x0.domain(asthmadata.sort(function(a, b) { return a.Difference - b.Difference; })
			.map(function(d) { return d.State; }))
			.copy();
	}
	
    var transition = svgChart.transition().duration(750);
    var delay = function(d, i) { return i * 50; };
		
	transition.selectAll("g.g")
		.delay(delay)
		.attr("transform",function(d){return "translate("+x2(d.State)+",0)";});

    transition.select(".x.axis")
        .call(xAxis)
      .selectAll("g")
        .delay(delay);
  }
	
////////////////////////
//Handles the map caption
////////////////////////
  var caption = d3.select('#caption')
  ,starter = caption.html();

  function showCaption(d,i) {
    var name = names[d.id];
    caption.html(name);
  }
	
}
