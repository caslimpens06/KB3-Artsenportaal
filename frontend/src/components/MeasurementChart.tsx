import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

interface Measurement {
  id: number;
  dateTime: string;
  value: string;
  type: string;
}

interface LabResult {
  id: number;
  resultName: string;
  value: string;
  unit: string;
  labResultGroup: string;
  labResultGroupId: number;
  measurements: Measurement[];
}

interface MeasurementChartProps {
  measurements: Measurement[];
  labResult: LabResult;
}

const MeasurementChart: React.FC<MeasurementChartProps> = ({ measurements, labResult }) => {
  const chartRef = useRef<SVGSVGElement>(null);

  const createChart = useCallback(() => {
    if (!chartRef.current || !measurements || measurements.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    console.log(`Creating measurement chart with ${measurements.length} measurements for ${labResult.resultName}`);

    // Sort measurements by date
    const sortedMeasurements = [...measurements].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    // Format dates for better display and parse values
    const formattedMeasurements = sortedMeasurements.map(measurement => {
      // Try to parse the value as a number, if it fails, use 0
      let numericValue = 0;
      try {
        // Handle different value formats
        // - '<0.5' should become 0.5
        // - '5.2' should remain 5.2
        // - Remove any other non-numeric characters
        const cleanedValue = measurement.value
          .replace('<', '')
          .replace(',', '.')
          .replace(/[^0-9.]/g, '');
          
        numericValue = parseFloat(cleanedValue);
        if (isNaN(numericValue)) numericValue = 0;
      } catch (error) {
        console.warn(`Error parsing measurement value: ${measurement.value}`, error);
      }

      return {
        ...measurement,
        numericValue: numericValue,
        originalValue: measurement.value,
        displayDate: new Date(measurement.dateTime).toLocaleDateString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

    // Filter out measurements with value 0 (could not be parsed or have no value)
    const validMeasurements = formattedMeasurements.filter(m => m.numericValue > 0);

    // Skip chart creation if no valid numeric values
    if (validMeasurements.length === 0) {
      d3.select(chartRef.current)
        .append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '16px')
        .text('No numeric data available for this measurement');
      return;
    }

    console.log('Date range:', 
      new Date(validMeasurements[0].dateTime).toLocaleDateString(),
      'to', 
      new Date(validMeasurements[validMeasurements.length-1].dateTime).toLocaleDateString(),
      `(${validMeasurements.length} valid data points)`
    );

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

    // Find min/max dates and values
    const minDate = d3.min(validMeasurements, d => new Date(d.dateTime)) as Date;
    const maxDate = d3.max(validMeasurements, d => new Date(d.dateTime)) as Date;
    
    // Add padding on both sides
    const dateRange = [
      new Date(minDate.getFullYear(), minDate.getMonth() - 1, minDate.getDate()),
      new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, maxDate.getDate())
    ];

    // Find min/max values, adding 10% padding
    const minValue = d3.min(validMeasurements, d => d.numericValue) as number;
    const maxValue = d3.max(validMeasurements, d => d.numericValue) as number;
    const valueRange = maxValue - minValue;
    const valuePadding = Math.max(valueRange * 0.1, 0.1); // At least 0.1 padding even if all values are the same

    const x = d3.scaleTime()
      .domain(dateRange)
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([Math.max(0, minValue - valuePadding), maxValue + valuePadding])
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

    // Create line generator
    const line = d3.line<any>()
      .x(d => x(new Date(d.dateTime)))
      .y(d => y(d.numericValue))
      .curve(d3.curveMonotoneX); // Smoother curve

    // Add the line path
    svg.append('path')
      .datum(validMeasurements)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6') // Blue color
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add data points
    svg.selectAll('.dot')
      .data(validMeasurements)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(new Date(d.dateTime)))
      .attr('cy', d => y(d.numericValue))
      .attr('r', 5)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // Add value labels - limit to avoid overcrowding
    // Calculate an appropriate step to avoid overcrowding based on number of data points
    const labelStep = Math.max(2, Math.floor(validMeasurements.length / 15));
    const labelsToShow = validMeasurements.filter((_, i) => i % labelStep === 0);
    
    svg.selectAll('.value-label')
      .data(labelsToShow)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => x(new Date(d.dateTime)))
      .attr('y', d => y(d.numericValue) - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#3b82f6')
      .text(d => d.originalValue);

    // Add axes with proper ticks
    const xAxis = svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(Math.min(validMeasurements.length, 10)) // Adaptive number of ticks
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
      .text(`${labResult.resultName} ${labResult.unit ? `(${labResult.unit})` : ''}`);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${width/2},${height + margin.bottom - 15})`)
      .attr('font-size', '14px')
      .text('Date Time');

    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${width/2},${-margin.top/2})`)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(`${labResult.resultName} Values (${validMeasurements.length} measurements)`);

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

    svg.selectAll('.dot')
      .on('mouseover', (event, d: any) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`
          <strong>Date:</strong> ${d.displayDate}<br>
          <strong>Value:</strong> ${d.originalValue} ${labResult.unit || ''}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

  }, [measurements, labResult]);

  useEffect(() => {
    createChart();
    
    // Clean up function to remove tooltips when component unmounts
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };
  }, [createChart]);

  if (!measurements || measurements.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border text-center">
        <p className="text-gray-500">No measurement data available for this lab result.</p>
      </div>
    );
  }

  return <svg ref={chartRef} className="w-full"></svg>;
};

export default MeasurementChart; 