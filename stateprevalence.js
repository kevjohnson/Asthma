 
var width = 960,
    height = 500;

var quantizeresp = d3.scale.quantize()
    .domain([.04, .17])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));
	
var quantizepred = d3.scale.quantize()
    .domain([.07, .13])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));
	
var quantizediff = d3.scale.quantize()
    .domain([0, .04])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));
 
var path = d3.geo.path();
 
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
  

  
  asthmadata.forEach(function(d) { responseData[d.State] = +d.Response; });
  asthmadata.forEach(function(d) { predictedData[d.State] = +d.Predicted; });
  asthmadata.forEach(function(d) { differenceData[d.State] = +d.Difference; });

  var select = d3.select("body").append("select");
  

  var parameters = ["Response","Predicted","Difference"];
  select.selectAll("option")
	.data(parameters)
	.enter().append("option")
	.attr("value", function(d){return d;})
	.text(function(d){return d;});

  select.on("change",function(){
	var parameter = parameters[this.selectedIndex];
	updateMap(parameter);	
	});
  var g = svg.append("g")
	.attr("class", "states")
  
  updateMap("Response");

  function updateMap(parameter){
	  var names = {};
	  statenames.forEach(function(d){
		  names[d.id] = d.name;
		});
	  asthmadata.forEach(function(d){
		if(parameter=="Response"){r = d.Response*100;}
		if(parameter=="Predicted"){r = d.Predicted*100;}
		if(parameter=="Difference"){r = d.Difference*100;}
		names[d.State] = names[d.State] + ": " + r.toFixed(1) + "%";
	  });

	g.selectAll("path").remove();
    var paths = g.selectAll("path")
      .data(topojson.object(us, us.objects.states).geometries)
    .enter().append("path")
      .attr("class", function(d) {
	  if(parameter==="Response"){
		
		return quantizeresp(responseData[d.id]);
	  
	  } else if(parameter==="Predicted"){
		
		return quantizepred(predictedData[d.id]);
		
	  } else{
		
		return quantizediff(differenceData[d.id])};
	  
	  })


      .attr("d", path)
	  .on("mouseover",showCaption)
	  .on("mouseout",function(){caption.html(starter);});
  var caption = d3.select('#caption')
  ,starter = caption.html();

  function showCaption(d,i) {
    var name = names[d.id];
    caption.html(name);
  }
}
}