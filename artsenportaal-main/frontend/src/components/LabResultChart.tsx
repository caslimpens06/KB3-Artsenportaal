import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Measurement {
  id: number;
  measurementId: string;
  dateTime: string;
  value: string;
}

interface Props {
  data: Measurement[];
  unit: string;
  resultName: string;
}

const LabResultChart: React.FC<Props> = ({ data, unit, resultName }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates and values
    const parsedData = data.map(d => ({
      ...d,
      date: new Date(d.dateTime),
      numericValue: parseFloat(d.value)
    }));

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
      .range([0, width])
      .nice();

    const yMin = d3.min(parsedData, d => d.numericValue);
    const yMax = d3.max(parsedData, d => d.numericValue);

    const yScale = d3.scaleLinear()
      .domain([
        yMin ? yMin * 0.9 : 0,
        yMax ? yMax * 1.1 : 100
      ])
      .range([height, 0])
      .nice();

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => d3.timeFormat('%Y-%m-%d %H:%M')(d as Date));

    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g')
      .call(yAxis);

    // Add axis labels
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text(unit);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(resultName);

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.numericValue));

    // Add line path
    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // Add dots
    svg.selectAll('.dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.numericValue))
      .attr('r', 5)
      .attr('fill', 'steelblue')
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background-color', 'white')
          .style('padding', '5px')
          .style('border', '1px solid #ddd')
          .style('border-radius', '3px')
          .style('pointer-events', 'none');

        tooltip.html(`
          <div>Date: ${d3.timeFormat('%Y-%m-%d %H:%M')(d.date)}</div>
          <div>Value: ${d.value} ${unit}</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });

  }, [data, unit, resultName]);

  return <svg ref={svgRef}></svg>;
};

export default LabResultChart; 