const margin = { top: 70, right: 30, bottom: 100, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;


const x = d3.scaleTime()
    .range([0, width]);

const y = d3.scaleLinear()
    .range([height, 0]);

const svg = d3.select('#chart-container')
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip absolute bg-steelblue text-white border border-white rounded-lg p-2 opacity-75 hidden z-50");

const validData = []; 

d3.dsv(";", "/d3-graphs/patientxgraph/lab_results_patientx3.csv").then(function (data) {
  const parseDate = d3.timeParse("%d-%m-%Y%H:%M");
  data.forEach(d => {
      d.date = parseDate(d["Soort onderzoek"]);
      d.Kalium = parseFloat(d.Kalium);
      d.Natrium = parseFloat(d.Natrium);

 
      console.log("Parsed row:", { date: d.date, Kalium: d.Kalium, Natrium: d.Natrium });

      // Check for valid data and only push valid entries
      if (d.date && !isNaN(d.Kalium) && !isNaN(d.Natrium)) {
          validData.push(d); 
      }
  });

  // Filter lege of incorrecte datarijen
  const filteredValidData = validData.filter(d => {
      const isValidDate = d.date && !isNaN(d.date);
      const isValidKalium = !isNaN(d.Kalium);
      const isValidNatrium = !isNaN(d.Natrium);
      return isValidDate && (isValidKalium || isValidNatrium);
  });

  console.log("Filtered Data:", filteredValidData);

    x.domain(d3.extent(filteredValidData, d => d.date));
    y.domain([0, d3.max(filteredValidData, d => d[window.selectedElement])]);

    // Log de domeinen voor debugging
    console.log("X Domain:", x.domain());
    console.log("Y Domain:", y.domain());

    // Beginning of graph definition

    svg.append('g')
        .attr("transform", `translate(0, ${height + 20})`)
        .style("font-size", "14px")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(d3.timeFormat("%d-%m-%Y"))
        )
        .call(g => g.select(".domain").remove())
        .selectAll(".tick text")
        .style("fill", "#777")
        .attr("text-anchor", "middle")
        .attr("dy", "1em");

    svg.append("g")
        .style("font-size", "14px")
        .call(d3.axisLeft(y)
            .ticks(8)
            .tickValues(d3.range(0, 225, 25))
            .tickFormat(d => d)
            .tickSize(0)
            .tickPadding(10))
        .call(g => g.select(".domain").remove())
        .selectAll(".tick text")
        .style("fill", "#777")
        .style("visibility", "visible");

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text(window.selectedElement + " (mmol/L)");

    svg.selectAll("xGrid")
        .data(x.ticks().slice(1))
        .join("line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5);

    svg.selectAll("yGrid")
        .data(d3.range(25, 225, 25))
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5);

    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text("JDM data patient x");

    svg.append("text")
        .attr("class", "source-credit")
        .attr("x", width - 1125)
        .attr("y", height + margin.bottom - 3)
        .style("font-size", "9px")
        .style("font-family", "sans-serif")
        .text("JDB Dashboard grafiek x");

    // End of graph definition

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d[window.selectedElement]));

    // Filter valid data for the line generator
    const validLineData = filteredValidData.filter(d => !isNaN(d[window.selectedElement]) && d.date);

    // Filter out invalid data points for tooltip
    const filteredDataForTooltip = filteredValidData.filter(d => d.date && !isNaN(d[window.selectedElement]));

    svg.append("path")
        .datum(validLineData) 
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "steelblue")
        .style("stroke", "white")
        .attr("opacity", .70)
        .style("pointer-events", "none");

    const listeningRect = svg.append("rect")
        .attr("width", width)
        .attr("height", height);

    listeningRect.on("mousemove", function (event) {
        const [xCoord] = d3.pointer(event, this);
        const bisectDate = d3.bisector(d => d.date).left;
        const x0 = x.invert(xCoord);
        const i = bisectDate(filteredDataForTooltip, x0, 1);
        
        console.log("Filtered Data Length:", filteredDataForTooltip.length);
        
        // Check if the index is out of range
        if (i <= 0 || i > filteredDataForTooltip.length) {
            console.warn("Index out of range for bisector", { i });
            return; // Exit if index is out of range
        }
        
        const d0 = filteredDataForTooltip[i - 1]; 
        const d1 = filteredDataForTooltip[i < filteredDataForTooltip.length ? i : i - 1]; 

        console.log("Data Points:", { d0, d1 });

        if (!d0 || !d1 || !d0.date || !d1.date) {
            console.warn("Invalid data points for tooltip", { d0, d1 });
            return;
        }

        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        const xPos = x(d.date);
        const yPos = y(d[window.selectedElement]);

 
        const rect = listeningRect.node().getBoundingClientRect();
        const tooltipX = rect.left + xPos + 10;
        const tooltipY = rect.top + yPos - 30; 

        circle.attr("cx", xPos)
            .attr("cy", yPos)
            .transition()
            .duration(50)
            .attr("r", 5);

        tooltip
            .style("display", "block") 
            .style("left", `${tooltipX}px`) 
            .style("top", `${tooltipY}px`)
            .html(`<strong>Date:</strong> ${d.date.toLocaleDateString()}<br><strong>${window.selectedElement}:</strong> ${d[window.selectedElement] !== undefined ? d[window.selectedElement] + ' mmol/L' : 'N/A'}`);
    });

    listeningRect.on("mouseleave", function () {
        circle.transition()
            .duration(50)
            .attr("r", 0);
        tooltip.style("display", "none");
    });

    console.log("Selected Element:", window.selectedElement);
});

window.redrawChart = function() {
  svg.selectAll("*").remove(); 

  d3.dsv(";", "/d3-graphs/patientxgraph/lab_results_patientx3.csv").then(function (data) {
    const parseDate = d3.timeParse("%d-%m-%Y%H:%M"); 
    data.forEach(d => {
        d.date = parseDate(d["Soort onderzoek"]); 
        d.Kalium = parseFloat(d.Kalium); 
        d.Natrium = parseFloat(d.Natrium);
    });

    const validData = data.filter(d => {
        const isValidDate = d.date && !isNaN(d.date);
        const isValidKalium = !isNaN(d.Kalium);
        const isValidNatrium = !isNaN(d.Natrium);
        return isValidDate && (isValidKalium || isValidNatrium);
    });

    // Controleer of er geldige data is
    if (validData.length === 0) {
      console.warn("Geen geldige data gevonden voor het tekenen van de grafiek.");
      return;
    }
    x.domain(d3.extent(validData, d => d.date));
    y.domain([0, d3.max(validData, d => Math.max(d.Kalium, d.Natrium))]);

    svg.append('g')
        .attr("transform", `translate(0, ${height + 20})`)
        .style("font-size", "14px")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(d3.timeFormat("%d-%m-%Y"))
        )
        .call(g => g.select(".domain").remove())
        .selectAll(".tick text")
        .style("fill", "#777")
        .attr("text-anchor", "middle")
        .attr("dy", "1em");

    svg.append("g")
        .style("font-size", "14px")
        .call(d3.axisLeft(y)
            .ticks(8)
            .tickValues(d3.range(0, 225, 25))
            .tickFormat(d => d)
            .tickSize(0)
            .tickPadding(10))
        .call(g => g.select(".domain").remove())
        .selectAll(".tick text")
        .style("fill", "#777")
        .style("visibility", "visible");

    window.selectedElements.forEach(element => {
      const validLineData = validData.filter(d => !isNaN(d[element]) && d.date);
      
      svg.append("path")
          .datum(validLineData)
          .attr("fill", "none")
          .attr("stroke", element === 'Kalium' ? "steelblue" : "orange") 
          .attr("stroke-width", 2)
          .attr("d", d3.line()
              .x(d => x(d.date))
              .y(d => y(d[element]))
          );
    });

    svg.selectAll("xGrid")
        .data(x.ticks().slice(1))
        .join("line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5);

    svg.selectAll("yGrid")
        .data(d3.range(25, 225, 25))
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5);

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text(window.selectedElements.join(", ") + " (mmol/L)"); 
  });
};