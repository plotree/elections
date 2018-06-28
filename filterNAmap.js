// filter based on province, winning party and voteMargin
// class of the circles is naSeatCircle
// class of voronoi circle region is circle-catcher

// global variables for scaling na seat size
const base_bubble = 3 // min size that all bubbles take
const margin_range = 5 // range for vote margin

// width and height for voronoi boundaries
var width = 1000, height = 600;

// filter transition time (fadein/ fadeout)
var filtTransTime = 1000; // ms
// circle catch (voronoi) radius
var circle_catch_rad = 20;

// get size of the na seat circles
function getCircleSize(voteMargin){
  return base_bubble + ((voteMargin/ 100) * margin_range)
}

// master function for filtering
function filterCircles(province, party, voteMargin){

  // in case the argument is null, do not filter in that category
  // province filter
  function filterProvince(datum){
    if (province == null){
      return true;
    }
    else {
      return province.includes(datum);
    }
  }
  // Party filter
  function filterParty(datum){
    if (party == null){
      return true;
    }
    else {
      return party.includes(datum);
    }
  }
  // VoteMargin filter
  function filterVoteMargin(datum){
    if (voteMargin == null) {
      return true;
    }
    else {
      return (voteMargin[0] <= datum && datum <= voteMargin[1]);
    }
  }

  // composite filter combining by and(ing) the above category logicals
  // filteres true means filteres elements whereas false means unfiltered elements
  function compFilter(filtered){
    return function(d){
      var logical = filterProvince(d.Province) && filterParty(d.results[0].party) && filterVoteMargin(d.voteMargin)
      if (filtered == true){
        return logical;
      }
      else {
        return !(logical);
      }
    }
  }


  ///// transition for the na seat circles /////

  // filtered remain
  d3.selectAll(".naSeatCircle")
    .filter(compFilter(true))
    .transition()
    .duration(filtTransTime)
    .attr('r', d => d.radiusInit)
  // unfiltered fadeout
  d3.selectAll(".naSeatCircle")
    .filter(compFilter(false))
    .transition()
    .duration(filtTransTime)
    .attr('r', 0)

  ///// transition for the circle catchers /////

  // filtered circle catchers remain
  d3.selectAll(".circle-catcher")
    .filter(compFilter(true))
    .transition("cicleCatchTrans")
    .duration(filtTransTime)
    .attr('r', d => circle_catch_rad)
    .style('display', 'block')
  // unfilteres circle catchers fadeout
  d3.selectAll(".circle-catcher")
    .filter(compFilter(false))
    .transition("cicleCatchTrans")
    .duration(filtTransTime)
    .attr('r', 0)
    .style('display', 'none')

  // original nodes
  var nodes = d3.selectAll(".naSeatCircle").data();

  // filteres nodes
  var nodes_filtered = nodes.filter(compFilter(true));

  // update selection/ update clipPaths
  var polygon = d3.selectAll(".clip.NAmap")
                  .data(voronoi.polygons(nodes_filtered), d => d.data.seat) // make sure to make data joins wrt seat
                    //Make sure each clipPath will have a unique id (connected to the circle element)
                    .attr("id", d => (d != null) ? "clipNAmap" + d.data.seat : "clipNAmap" + "NA")
                    .select("path")
                    .attr("class", "clip-path-circle NAmap")
                    .call(redrawPolygon)
  // enter selection, create new clipPaths
  var polygon_enter = d3.selectAll(".clip.NAmap")
                    .enter()
                    .append("clipPath")
                    .attr("class", "clip NAmap")
                    //Make sure each clipPath will have a unique id (connected to the circle element)
                    .attr("id", d => (d != null) ? "clipNAmap" + d.data.seat : "clipNAmap" + "NA")
                    //Then append a path element that will define the shape of the clipPath
                    .append("path")
                    .attr("class", "clip-path-circle NAmap")
                    .call(redrawPolygon)

  // exite selection, remove old clipPaths
  var polygon_exit = d3.selectAll(".clip.NAmap")
                      .exit()
                      .remove()
}


// redraw voronoi cell/ polygon function
function redrawPolygon(polygon) {
  polygon
      .attr("d", function(d) { return d ? "M" + d.join(",") + "Z" : null; })
}

// main voronoi definition 
var voronoi = d3.voronoi()
                .x(d => d.x) // with some noise on x and y centers
                .y(d => d.y)
                .extent([[0, 0], [width, height]]);
