import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

interface LabResult {
  id: number;
  resultName: string;
  value: number;
  unit: string;
  datetime: string;
}

interface Patient {
  id: number;
  name: string;
  lab_results: LabResult[];
}

interface PatientProfileProps {
  patient: Patient;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patient }) => {
  const labResultsChartRef = useRef<SVGSVGElement>(null);
  const timelineChartRef = useRef<SVGSVGElement>(null);

  const createLabResultsChart = useCallback(() => {
    if (!labResultsChartRef.current) return;

    // Clear previous chart
    d3.select(labResultsChartRef.current).selectAll('*').remove();

    // Group lab results by test name
    const groupedResults = d3.group(patient.lab_results, (d: LabResult) => d.resultName);

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(labResultsChartRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleTime()
      .domain(d3.extent(patient.lab_results, (d: LabResult) => new Date(d.datetime)) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(patient.lab_results, (d: LabResult) => d.value) as number * 0.9,
        d3.max(patient.lab_results, (d: LabResult) => d.value) as number * 1.1
      ])
      .range([height, 0]);

    // Create line generator
    const line = d3.line<LabResult>()
      .x((d: LabResult) => x(new Date(d.datetime)))
      .y((d: LabResult) => y(d.value));

    // Add lines for each test
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    groupedResults.forEach((results: LabResult[], testName: string) => {
      svg.append('path')
        .datum(results)
        .attr('fill', 'none')
        .attr('stroke', colorScale(testName))
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add dots
      svg.selectAll(`dot-${testName}`)
        .data(results)
        .enter()
        .append('circle')
        .attr('cx', (d: LabResult) => x(new Date(d.datetime)))
        .attr('cy', (d: LabResult) => y(d.value))
        .attr('r', 5)
        .attr('fill', colorScale(testName));
    });

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .selectAll('g')
      .data(Array.from(groupedResults.keys()))
      .enter().append('g')
      .attr('transform', (d: string, i: number) => `translate(0,${i * 20})`);

    legend.append('rect')
      .attr('x', width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', colorScale);

    legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text((d: string) => d);
  }, [patient.lab_results]);

  const createTimelineChart = useCallback(() => {
    if (!timelineChartRef.current) return;

    // Clear previous chart
    d3.select(timelineChartRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(timelineChartRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleTime()
      .domain(d3.extent(patient.lab_results, (d: LabResult) => new Date(d.datetime)) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(Array.from(new Set(patient.lab_results.map((d: LabResult) => d.resultName))))
      .range([0, height])
      .padding(0.1);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    // Add dots
    svg.selectAll('circle')
      .data(patient.lab_results)
      .enter()
      .append('circle')
      .attr('cx', (d: LabResult) => x(new Date(d.datetime)))
      .attr('cy', (d: LabResult) => (y(d.resultName) || 0) + y.bandwidth() / 2)
      .attr('r', 5)
      .attr('fill', 'steelblue');
  }, [patient.lab_results]);

  useEffect(() => {
    if (patient?.lab_results && patient.lab_results.length > 0) {
      createLabResultsChart();
      createTimelineChart();
    }
  }, [patient, createLabResultsChart, createTimelineChart]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{patient.name}'s Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h3 className="text-xl font-semibold mb-4">Lab Results Over Time</h3>
            <div className="bg-white p-4 rounded-lg border">
              <svg ref={labResultsChartRef}></svg>
            </div>
          </div>
          <div className="col-span-2">
            <h3 className="text-xl font-semibold mb-4">Test Timeline</h3>
            <div className="bg-white p-4 rounded-lg border">
              <svg ref={timelineChartRef}></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile; 