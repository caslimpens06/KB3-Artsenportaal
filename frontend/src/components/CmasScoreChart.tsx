import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CmasScore {
  id: number;
  date: string;
  score: number;
  category: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface Props {
  data: CmasScore[];
}

const CmasScoreChart: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.score) || 0])
      .range([height, 0]);

    // Create line generator
    const line = d3
      .line<CmasScore>()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.score));

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    // Add Y axis
    svg.append('g').call(d3.axisLeft(yScale));

    // Add the line
    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // Add dots
    const dots = svg
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => xScale(new Date(d.date)))
      .attr('cy', d => yScale(d.score))
      .attr('r', 5)
      .attr('fill', d => (d.score >= 10 ? '#4CAF50' : '#FFA726'))
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Add tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '5px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add hover effects
    dots.each(function(d) {
      d3.select(this)
        .on('mouseover', function(event) {
          tooltip
            .transition()
            .duration(200)
            .style('opacity', 0.9);
          tooltip
            .html(
              `Date: ${new Date(d.date).toLocaleDateString()}<br/>
               Score: ${d.score}<br/>
               Category: ${d.category}`
            )
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function() {
          tooltip
            .transition()
            .duration(500)
            .style('opacity', 0);
        });
    });

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default CmasScoreChart; 