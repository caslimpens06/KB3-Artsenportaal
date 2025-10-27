import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

interface CMASScore {
  id: number;
  scoreDate: string;
  score: number;
  scoreCategory?: string;
}

interface Patient {
  id: number;
  name: string;
  patientId: string;
  cmas_scores: CMASScore[];
}

interface CMASChartProps {
  patient: Patient;
}

const CMASChart: React.FC<CMASChartProps> = ({ patient }) => {
  const chartRef = useRef<SVGSVGElement>(null);

  const createChart = useCallback(() => {
    if (!chartRef.current || !patient.cmas_scores || patient.cmas_scores.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    console.log(`Creating chart with ${patient.cmas_scores.length} scores`);

    // Sort scores by date
    const sortedScores = [...patient.cmas_scores].sort(
      (a, b) => new Date(a.scoreDate).getTime() - new Date(b.scoreDate).getTime()
    );

    // Format dates for better display
    const formattedScores = sortedScores.map(score => ({
      ...score,
      displayDate: new Date(score.scoreDate).toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }));

    console.log('Date range:', 
      new Date(sortedScores[0].scoreDate).toLocaleDateString(),
      'to', 
      new Date(sortedScores[sortedScores.length-1].scoreDate).toLocaleDateString(),
      `(${sortedScores.length} data points)`
    );

    // Separate scores into two categories based on the scoreCategory field or score value
    const highScores = formattedScores.filter(score => 
      score.scoreCategory === '>10' || score.score > 10
    );
    
    const lowScores = formattedScores.filter(score => 
      score.scoreCategory === '4-9' || (score.score >= 4 && score.score <= 10)
    );

    console.log(`High scores (>10): ${highScores.length}, Low scores (4-9): ${lowScores.length}`);

    // Set up dimensions
    const margin = { top: 30, right: 40, bottom: 80, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales with padding so points don't get cut off
    const minDate = d3.min(sortedScores, d => new Date(d.scoreDate)) as Date;
    const maxDate = d3.max(sortedScores, d => new Date(d.scoreDate)) as Date;
    
    // Add padding on both sides
    const dateRange = [
      new Date(minDate.getFullYear(), minDate.getMonth() - 1, minDate.getDate()),
      new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, maxDate.getDate())
    ];

    const x = d3.scaleTime()
      .domain(dateRange)
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 52]) // CMAS scale ranges from 0 to 52
      .range([height, 0]);

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .attr('stroke-opacity', 0.1);

    svg.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .attr('stroke-opacity', 0.1);

    // Create separate line generators for each category
    const highLine = d3.line<any>()
      .x(d => x(new Date(d.scoreDate)))
      .y(d => y(d.score))
      .curve(d3.curveMonotoneX);

    const lowLine = d3.line<any>()
      .x(d => x(new Date(d.scoreDate)))
      .y(d => y(d.score))
      .curve(d3.curveMonotoneX);

    // Add high scores trend line if there are enough points
    if (highScores.length > 1) {
      svg.append('path')
        .datum(highScores)
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', highLine);
    }

    // Add low scores trend line if there are enough points
    if (lowScores.length > 1) {
      svg.append('path')
        .datum(lowScores)
        .attr('fill', 'none')
        .attr('stroke', '#777')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', lowLine);
    }

    // Add high scores (>10) dots in black
    svg.selectAll('.dot-high')
      .data(highScores)
      .enter()
      .append('circle')
      .attr('class', 'dot-high')
      .attr('cx', d => x(new Date(d.scoreDate)))
      .attr('cy', d => y(d.score))
      .attr('r', 6)
      .attr('fill', '#000')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add low scores (4-9) dots in gray
    svg.selectAll('.dot-low')
      .data(lowScores)
      .enter()
      .append('circle')
      .attr('class', 'dot-low')
      .attr('cx', d => x(new Date(d.scoreDate)))
      .attr('cy', d => y(d.score))
      .attr('r', 6)
      .attr('fill', '#777')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add score labels - limit to avoid overcrowding
    // Calculate an appropriate step to avoid overcrowding based on number of data points
    const labelStep = Math.max(2, Math.floor(formattedScores.length / 15));
    const labelsToShow = formattedScores.filter((_, i) => i % labelStep === 0);
    
    svg.selectAll('.score-label')
      .data(labelsToShow)
      .enter()
      .append('text')
      .attr('class', 'score-label')
      .attr('x', d => x(new Date(d.scoreDate)))
      .attr('y', d => y(d.score) - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', d => {
        if (d.scoreCategory === '>10' || d.score > 10) {
          return '#000';
        } else {
          return '#777';
        }
      })
      .text(d => d.score);

    // Add axes with proper ticks
    const xAxis = svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(d3.timeMonth.every(3)) // Show quarterly months for readability
        .tickFormat(d3.timeFormat('%d-%m-%Y') as any));

    // Rotate x-axis labels for better readability
    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    svg.append('g')
      .call(d3.axisLeft(y));

    // Add axis labels
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${-margin.left + 15},${height/2}) rotate(-90)`)
      .attr('font-size', '14px')
      .text('CMAS Score');

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${width/2},${height + margin.bottom - 15})`)
      .attr('font-size', '14px')
      .text('Date');

    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${width/2},${-margin.top/2})`)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(`CMAS Scores Over Time (${formattedScores.length} scores)`);

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 140}, 10)`);

    // High scores legend
    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 10)
      .attr('r', 6)
      .attr('fill', '#000')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
      
    legend.append('text')
      .attr('x', 12)
      .attr('y', 14)
      .attr('font-size', '12px')
      .text('CMAS Score > 10');

    // Low scores legend
    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 30)
      .attr('r', 6)
      .attr('fill', '#777')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
      
    legend.append('text')
      .attr('x', 12)
      .attr('y', 34)
      .attr('font-size', '12px')
      .text('CMAS Score 4-9');

    // Add tooltip for more detailed info on hover
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(255, 255, 255, 0.9)')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add tooltips to dots
    svg.selectAll('.dot-high, .dot-low')
      .on('mouseover', (event, d: any) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`
          <strong>Date:</strong> ${d.displayDate}<br>
          <strong>Score:</strong> ${d.score}<br>
          <strong>Category:</strong> ${d.scoreCategory || (d.score > 10 ? 'Score > 10' : 'Score 4-9')}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

  }, [patient.cmas_scores]);

  useEffect(() => {
    createChart();
    
    // Clean up any tooltips when component unmounts
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };
  }, [createChart]);

  if (!patient.cmas_scores || patient.cmas_scores.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border text-center">
        <p className="text-gray-500">No CMAS scores available for this patient.</p>
      </div>
    );
  }

  return <svg ref={chartRef} className="w-full"></svg>;
};

export default CMASChart; 