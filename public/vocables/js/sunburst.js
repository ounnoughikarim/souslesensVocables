// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Sunburst = (function () {
    var self = {};

    self.draw = function (divId, root, options) {
        var svg = d3.select("svg");
        svg.selectAll("*").remove();
        $("#" + divId).html("");

        /*  var width = 960,
            height = 700,*/
        var width = 760,
            height = 500,
            radius = Math.min(width, height) / 2,
            color = d3.scale.category10();

        svg = d3
            .select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height * 0.52 + ")");

        var partition = d3.layout
            .partition()
            .sort(null)
            .size([2 * Math.PI, radius * radius])
            .value(function (_d) {
                return 1;
            });

        var arc = d3.svg
            .arc()
            .startAngle(function (d) {
                return d.x;
            })
            .endAngle(function (d) {
                return d.x + d.dx;
            })
            .innerRadius(function (d) {
                return Math.sqrt(d.y);
            })
            .outerRadius(function (d) {
                return Math.sqrt(d.y + d.dy);
            });

        svg = d3
            .select("#" + divId)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height * 0.52 + ")");

        var path = svg
            .datum(root)
            .selectAll("path")
            .data(partition.nodes)
            .enter()
            .append("path")
            .attr("display", function (d) {
                return d.depth ? null : "none";
            }) // hide inner ring
            .attr("d", arc)
            .style("stroke", "#fff")
            .style("fill", function (d) {
                if (!d.children && !d.parent) return "#ddd";
                return color((d.children ? d : d.parent).index);
            })
            .style("fill-rule", "evenodd")
            .each(stash)
            .on("click", function (d) {
                onClick(d);
            })
            .on("mouseover", function (d) {
                onMouseOver(d);
            });

        d3.selectAll("input").on("change", function change() {
            var value =
                this.value === "count"
                    ? function () {
                          return 1;
                      }
                    : function (d) {
                          return d.size;
                      };

            path.data(partition.value(value).nodes).transition().duration(1500).attrTween("d", arcTween);
        });

        var tooltip = d3
            .select("#" + divId)
            .append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("opacity", 0)
            .style("left", "380px")
            .style("top", "250px");

        (width = 960), (height = 700), (radius = Math.min(width, height) / 2), (color = d3.scale.category10());

        // Stash the old values for transition.
        function stash(d) {
            d.x0 = d.x;
            d.dx0 = d.dx;
        }

        // Interpolate the arcs in data space.
        function arcTween(a) {
            var i = d3.interpolate({ x: a.x0, dx: a.dx0 }, a);
            return function (t) {
                var b = i(t);
                a.x0 = b.x;
                a.dx0 = b.dx;
                return arc(b);
            };
        }

        function onClick(d) {
            if (options && options.onNodeClick) {
                options.onNodeClick(d);
            }
            // d3.select(this).attr("stroke","black")
            var text = d.name;
            tooltip.html(text);
            return tooltip.transition().duration(50).style("opacity", 0.9);
        }

        function onMouseOver(d) {
            // d3.select(this).attr("stroke","black")
            var text = d.name;
            if (!text) text = d.index;
            tooltip.html(text);
            return tooltip.transition().duration(50).style("opacity", 0.9);
        }

        d3.select(self.frameElement).style("height", height + "px");
    };

    return self;
})();
