var w = 1200;
var h = 200;
var bp = 1;
var gp = 3;
var c = d3.scale.category10();

var svg = d3.select("body")
	.append("svg")
	.attr("width",w)
	.attr("height",h);
	
queue()
    .defer(d3.csv, "asthma.csv")
	.defer(d3.tsv, "us-state-names.tsv")
	.await(ready);
	
function ready(error, data, statenames) {

	svg.selectAll("rect.Response")
		.data(data)
		.enter()
		.append("rect")
		.attr("x",function(d,i){
			return i*((w-data.length*gp)/data.length)+i*gp;
		})
		.attr("y",function(d){
			return h-d.Response*1000-12;
		})
		.attr("width",(w-data.length*gp)/data.length/3-bp)
		.attr("height",function(d){
			return d.Response*1000;
		})
		.attr("fill",c(1));
		
	svg.selectAll("rect.Predicted")
		.data(data)
		.enter()
		.append("rect")
		.attr("x",function(d,i){
			return i*((w-data.length*gp)/data.length)+(w-data.length*gp)/data.length/3+i*gp;
		})
		.attr("y",function(d){
			return h-d.Predicted*1000-12;
		})
		.attr("width",(w-data.length*gp)/data.length/3-bp)
		.attr("height",function(d){
			return d.Predicted*1000;
		})
		.attr("fill",c(2));
		
	svg.selectAll("rect.Difference")
		.data(data)
		.enter()
		.append("rect")
		.attr("x",function(d,i){
			return i*((w-data.length*gp)/data.length)+2*(w-data.length*gp)/data.length/3+i*gp;
		})
		.attr("y",function(d){
			return h-d.Difference*1000-12;
		})
		.attr("width",(w-data.length*gp)/data.length/3-bp)
		.attr("height",function(d){
			return d.Difference*1000;
		})
		.attr("fill",c(3));
		
	var names = {};
		statenames.forEach(function(d){
			names[d.id] = d.code;
	});
	
	svg.selectAll("text")
		.data(data)
		.enter()
		.append("text")
		.attr("x",function(d,i){
			return i*((w-data.length*gp)/data.length)+i*gp+bp+(3/2)*(w-data.length*gp)/data.length/3-bp;
		})
		.attr("y",h)
		.text(function(d,i){return names[d.State];})
		.attr("font-family","sans-serif")
		.attr("font-size","12px")
		.attr("text-anchor","middle");
};