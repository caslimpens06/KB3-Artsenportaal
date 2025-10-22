import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Measurement {
  id: number;
  measurementId: string;
  dateTime: string;
  value: string;
}

interface LabResult {
  id: number;
  resultName: string;
  labResultId: string;
  value: string;
  unit: string;
  measurements: Measurement[];
}

interface Props {
  selectedResults: LabResult[];
}

// Helper function to create CSS-safe class names
const createSafeClassName = (name: string): string => {
  return `dot-${name
    .replace(/[^a-zA-Z0-9]/g, '-')  // Replace all non-alphanumeric characters with dashes
    .replace(/-+/g, '-')           // Replace multiple consecutive dashes with single dash
    .replace(/^-|-$/g, '')         // Remove leading/trailing dashes
    .toLowerCase()}`;
};

const MultiLabResultChart: React.FC<Props> = ({ selectedResults }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const allData: Array<{
      date: Date;
      numericValue: number;
      resultName: string;
      unit: string;
      originalValue: string;
      labResultId: number;
    }> = [];

    selectedResults.forEach(result => {
      if (result.measurements) {
        result.measurements.forEach(measurement => {
          const numericValue = parseFloat(measurement.value);
          if (!isNaN(numericValue)) {
            allData.push({
              date: new Date(measurement.dateTime),
              numericValue,
              resultName: result.resultName,
              unit: result.unit,
              originalValue: measurement.value,
              labResultId: result.id
            });
          }
        });
      }
    });

    return allData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedResults]);

  useEffect(() => {
    if (!selectedResults || selectedResults.length === 0 || !svgRef.current) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 60, right: 150, bottom: 80, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (chartData.length === 0) return;

    // Create color scale for different lab results
    const colorScale = d3.scaleOrdinal()
      .domain(selectedResults.map(r => r.resultName))
      .range(d3.schemeCategory10);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date) as [Date, Date])
      .range([0, width])
      .nice();

    // Group data by result for separate Y scales
    const dataByResult = d3.group(chartData, d => d.resultName);
    
    // For simplicity, use a single Y scale that encompasses all values
    const allValues = chartData.map(d => d.numericValue);
    const yMin = d3.min(allValues) || 0;
    const yMax = d3.max(allValues) || 100;

    const yScale = d3.scaleLinear()
      .domain([yMin * 0.9, yMax * 1.1])
      .range([height, 0])
      .nice();

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => d3.timeFormat('%Y-%m-%d')(d as Date));

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
      .style('font-size', '12px')
      .text('Values');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Selected Measurements Over Time');

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.numericValue))
      .curve(d3.curveMonotoneX);

    // Draw lines and points for each lab result
    dataByResult.forEach((resultData, resultName) => {
      const sortedData = Array.from(resultData).sort((a, b) => a.date.getTime() - b.date.getTime());
      const color = colorScale(resultName) as string;
      const safeClassName = createSafeClassName(resultName);

      // Add line path
      svg.append('path')
        .datum(sortedData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add dots with safe class names
      svg.selectAll(`.${safeClassName}`)
        .data(sortedData)
        .enter()
        .append('circle')
        .attr('class', safeClassName)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.numericValue))
        .attr('r', 4)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          // Remove any existing tooltips
          d3.selectAll('.tooltip').remove();
          
          const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('padding', '8px')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
            .style('z-index', '1000');

          tooltip.html(`
            <div><strong>${d.resultName}</strong></div>
            <div>Date: ${d3.timeFormat('%Y-%m-%d %H:%M')(d.date)}</div>
            <div>Value: ${d.originalValue} ${d.unit}</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
          d3.selectAll('.tooltip').remove();
        });
    });

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 20}, 20)`);

    selectedResults.forEach((result, index) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${index * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colorScale(result.resultName) as string);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .text(`${result.resultName} (${result.unit})`);
    });

    // Add units info if multiple units
    const uniqueUnits = Array.from(new Set(selectedResults.map(r => r.unit))).filter(Boolean);
    if (uniqueUnits.length > 1) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-style', 'italic')
        .style('fill', '#666')
        .text(`Note: Different units shown - ${uniqueUnits.join(', ')}`);
    }

  }, [selectedResults, chartData]);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="bg-white">
        <svg ref={svgRef}></svg>
      </div>

      {/* Data Table */}
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Measurement Data</h4>
            <p className="text-sm text-gray-600 mt-1">
              {chartData.length} measurements across {selectedResults.length} measurement type{selectedResults.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Measurement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((row, index) => {
                  const colorScale = d3.scaleOrdinal()
                    .domain(selectedResults.map(r => r.resultName))
                    .range(d3.schemeCategory10);
                  const color = colorScale(row.resultName) as string;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {d3.timeFormat('%Y-%m-%d %H:%M')(row.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: color }}
                          ></div>
                          {row.resultName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.originalValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiLabResultChart; 