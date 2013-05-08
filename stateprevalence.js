var width = 1000,
	height = 500,
	names = {},
	path = d3.geo.path();

var quantize = d3.scale.quantize()
	.range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);
 
queue()
  .defer(d3.json, "us-10m.json")
  .defer(d3.csv, "state-choropleth.csv")
	.defer(d3.tsv, "us-state-names.tsv")
  .await(ready);
  

function ready(error, us, asthmadata, statenames) {
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
    responseData[d.State] = +d.Response;
    predictedData[d.State] = +d.Predicted;
    differenceData[d.State] = +d.Difference;
    stateData[d.State]=[responseData[d.State],predictedData[d.State],differenceData[d.State]];    
    dataArray[idx][i]={State: d.State, value: stateData[d.State][idx]};
  
	});
}
//make a dropdown menu with the parameters as options
  var select = d3.select("body").append("select");  

  var parameters = ["Response","Predicted","Difference"];
  select.selectAll("option")
		.data(parameters)
	 .enter().append("option")
		.attr("value", function(d,i){return i;})
		.text(function(d){return d;});

  select.on("change",function(){
		var parameter = this.selectedIndex; //this.selectedIndex returns a number which corresponds to the parameter array above
		updateMap(parameter);
	});
  
	var g = svg.append("g")
		.attr("class", "states")
		.attr("id", "map")

  
  updateMap(0);

  function updateMap(parameter){

	  var r;
	  statenames.forEach(function(d){
		  names[d.id] = d.name;
		});
	  
		asthmadata.forEach(function(d,i){
			r=dataArray[parameter][i].value*100; //no more if/then statements!
			names[d.State] = names[d.State] + ": " + r.toFixed(1) + "%";
	  });

//change the domain of the quantize function to match the min and max of the data for the given parameter
	quantize.domain(
		[d3.min(dataArray[parameter], function(d,i){return dataArray[parameter][i].value;}),
		d3.max(dataArray[parameter], function(d,i){return dataArray[parameter][i].value;})]
	)

	g.selectAll("path").remove();

	var paths = g.selectAll("path")
		.data(topojson.object(us, us.objects.states).geometries)
	 .enter().append("path")
		.attr("class", function(d,i){return quantize( dataArray[parameter][i].value );})
		.attr("d", path)
		.on("mouseover",showCaption)
		.on("mouseout",function(){caption.html(starter);});
	
	updateLegend(parameter);
  }; 
  
  function updateLegend(parameter){

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
		svg.selectAll(".legend").remove();
	
		//draw the new legend by appending "quanta" number of g elements, each translated 25px down from the last
		var legend = svg.selectAll(".legend");
		
		legend.data(quantaValues)
		 .enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) {return "translate(0," + ((i * 25) + 25) + ")"; });
			
		//draw the boxes in each g, and give them the correct class to turn the right color
     svg.selectAll(".legend").append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .attr("class", function(d){return quantize(d.min);})
			.style("stroke","#000");
		
		//append the text labels to the g elements
    svg.selectAll(".legend").append("text")
			.attr("x", width - 21)
			.attr("y", 9)
			.attr("dy", ".4em")
			.attr("font-family", "sans-serif")
      .style("text-anchor", "end")
			.style("fill", "#000")
      .text(function(d) { return (d.min*100).toFixed(1) + "% - " + (d.max*100).toFixed(1) + "%"; });
			
		// change the legend title depending on the parameter being displayed
		svg.append("text")
			.classed("legend", true) //class as legend so it gets removed on update
			.attr("transform", "translate(0,12)")
			.attr("x",width-18)
			.attr("y", 0)
			.attr("dy", ".4em")
			.attr("font-family", "sans-serif")
			.style("text-anchor", "end")
			.text(parameters[parameter]);
  };
  
  var caption = d3.select('#caption')
  ,starter = caption.html();

  function showCaption(d,i) {
    var name = names[d.id];
    caption.html(name);
  }
}
