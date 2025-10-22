import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

interface LabResultGroup {
  id: number;
  groupName: string;
  resultCount: number;
}

interface LabResult {
  id: number;
  resultName: string;
  unit: string;
  labResultId: string;
  measurements: Measurement[];
}

interface Measurement {
  id: number;
  measurementId: string;
  dateTime: string;
  value: string;
}

interface AggregatedLabData {
  date: string;
  averageValue: number;
  measurementCount: number;
  resultName: string;
  unit: string;
}

const Labresultaten: React.FC = () => {
  const [labGroups, setLabGroups] = useState<LabResultGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<LabResult[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedLabData[]>([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchLabGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchLabResultsForGroup(selectedGroupId);
    }
  }, [selectedGroupId]);

  const processAggregatedData = useCallback(() => {
    // Group by date (day-level) and result name to get session-based averages
    const sessionData = new Map<string, Map<string, { values: number[], count: number }>>();
    
    selectedResults.forEach(result => {
      if (result.measurements) {
        result.measurements.forEach(measurement => {
          const numericValue = parseFloat(measurement.value);
          if (!isNaN(numericValue)) {
            const date = new Date(measurement.dateTime);
            // Group by specific date (YYYY-MM-DD) to represent sessions
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const resultKey = result.resultName;
            
            if (!sessionData.has(dateKey)) {
              sessionData.set(dateKey, new Map());
            }
            
            const dateMap = sessionData.get(dateKey)!;
            if (!dateMap.has(resultKey)) {
              dateMap.set(resultKey, { values: [], count: 0 });
            }
            
            const resultData = dateMap.get(resultKey)!;
            resultData.values.push(numericValue);
            resultData.count++;
          }
        });
      }
    });

    const aggregated: AggregatedLabData[] = [];
    sessionData.forEach((dateMap, dateKey) => {
      dateMap.forEach((data, resultName) => {
        const result = selectedResults.find(r => r.resultName === resultName);
        if (result && data.values.length > 0) {
          // Average all measurements for this result on this date (across all patients)
          aggregated.push({
            date: dateKey,
            averageValue: data.values.reduce((a, b) => a + b, 0) / data.values.length,
            measurementCount: data.count,
            resultName,
            unit: result.unit
          });
        }
      });
    });

    setAggregatedData(aggregated.sort((a, b) => a.date.localeCompare(b.date)));
  }, [selectedResults]);

  const createVisualization = useCallback(() => {
    if (!svgRef.current || aggregatedData.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Get the container dimensions dynamically
    const containerRect = svgRef.current.parentElement?.getBoundingClientRect();
    const containerWidth = containerRect?.width || 800;
    const containerHeight = Math.min(containerRect?.height || 500, 500); // Cap height at 500px

    const margin = { top: 40, right: 150, bottom: 80, left: 80 };
    const width = Math.max(containerWidth - margin.left - margin.right, 400);
    const height = Math.max(containerHeight - margin.top - margin.bottom, 300);

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group data by result name
    const dataByResult = d3.group(aggregatedData, d => d.resultName);
    const resultNames = Array.from(dataByResult.keys());
    
    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(resultNames)
      .range(d3.schemeCategory10);

    // Parse dates and create time scale
    const dates = Array.from(new Set(aggregatedData.map(d => d.date)))
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const xScale = d3.scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([0, width]);

    // Better Y scale with proper padding
    const minValue = d3.min(aggregatedData, d => d.averageValue) || 0;
    const maxValue = d3.max(aggregatedData, d => d.averageValue) || 100;
    const valueRange = maxValue - minValue;
    const padding = valueRange * 0.1; // 10% padding

    const yScale = d3.scaleLinear()
      .domain([
        Math.max(0, minValue - padding), // Don't go below 0 for lab values
        maxValue + padding
      ])
      .range([height, 0]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((domainValue) => {
        if (domainValue instanceof Date) {
          return d3.timeFormat('%Y-%m-%d')(domainValue);
        }
        return String(domainValue);
      }))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Gemiddelde Waarde');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Datum');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text(`${selectedGroupName} - Populatie Gemiddelden`);

    // Line generator
    const line = d3.line<AggregatedLabData>()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.averageValue))
      .curve(d3.curveMonotoneX);

    // Draw lines and points for each result
    dataByResult.forEach((data, resultName) => {
      const sortedData = Array.from(data).sort((a, b) => a.date.localeCompare(b.date));
      const color = colorScale(resultName) as string;

      // Add line
      svg.append('path')
        .datum(sortedData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('d', line);

      // Add dots
      svg.selectAll(`.dot-${resultName.replace(/[^a-zA-Z0-9]/g, '-')}`)
        .data(sortedData)
        .enter()
        .append('circle')
        .attr('class', `dot-${resultName.replace(/[^a-zA-Z0-9]/g, '-')}`)
        .attr('cx', d => xScale(new Date(d.date)))
        .attr('cy', d => yScale(d.averageValue))
        .attr('r', 5)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, 20)`);

    resultNames.forEach((resultName, index) => {
      const result = selectedResults.find(r => r.resultName === resultName);
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${index * 25})`);

      legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 10)
        .attr('y2', 10)
        .attr('stroke', colorScale(resultName) as string)
        .attr('stroke-width', 3);

      legendRow.append('circle')
        .attr('cx', 10)
        .attr('cy', 10)
        .attr('r', 5)
        .attr('fill', colorScale(resultName) as string);

      legendRow.append('text')
        .attr('x', 30)
        .attr('y', 10)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .text(`${resultName} (${result?.unit || ''})`);
    });

    // Add tooltips
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '10px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('z-index', '1000');

    svg.selectAll('circle')
      .on('mouseover', (event: any, d: unknown) => {
        const data = d as AggregatedLabData;
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <strong>${data.resultName}</strong><br/>
          <strong>Datum:</strong> ${data.date}<br/>
          <strong>Gemiddelde:</strong> ${data.averageValue.toFixed(2)} ${data.unit}<br/>
          <strong>Aantal metingen:</strong> ${data.measurementCount}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });
  }, [aggregatedData, selectedGroupName, selectedResults]);

  useEffect(() => {
    console.log('Selected results changed:', selectedResults);
    if (selectedResults.length > 0) {
      processAggregatedData();
    } else {
      setAggregatedData([]);
    }
  }, [selectedResults, processAggregatedData]);

  useEffect(() => {
    console.log('Aggregated data changed:', aggregatedData);
    if (selectedResults.length > 0 && aggregatedData.length > 0) {
      createVisualization();
    }
  }, [aggregatedData, createVisualization]);

  const fetchLabGroups = async () => {
    try {
      setLoading(true);
      console.log('Fetching lab groups...');
      const response = await axios.get('http://localhost:1337/api/lab-result-groups');
      console.log('Lab groups response:', response.data);
      const groups = response.data.data || [];
      
      // Count results per group
      const groupsWithCounts = await Promise.all(
        groups.map(async (group: any) => {
          console.log(`Fetching results for group ${group.id}: ${group.groupName}`);
          const resultsResponse = await axios.get(
            `http://localhost:1337/api/lab-results?filters[lab_result_group][id][$eq]=${group.id}&pagination[pageSize]=1000`
          );
          console.log(`Group ${group.groupName} has ${resultsResponse.data.data?.length || 0} results`);
          return {
            id: group.id,
            groupName: group.groupName,
            resultCount: resultsResponse.data.data?.length || 0
          };
        })
      );
      
      const filteredGroups = groupsWithCounts.filter(group => group.resultCount > 0);
      console.log('Filtered groups with results:', filteredGroups);
      setLabGroups(filteredGroups);
    } catch (error) {
      console.error('Error fetching lab groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabResultsForGroup = async (groupId: number) => {
    try {
      setLoading(true);
      console.log(`Fetching lab results for group ${groupId}`);
      
      // First get the lab results without populate
      const response = await axios.get(
        `http://localhost:1337/api/lab-results?filters[lab_result_group][id][$eq]=${groupId}&pagination[pageSize]=1000`
      );
      
      console.log('Lab results response:', response.data);
      const results = response.data.data || [];
      
      if (results.length === 0) {
        console.log('No lab results found for this group');
        setLabResults([]);
        setSelectedResults([]);
        return;
      }
      
      // Then fetch measurements for each result separately
      const resultsWithMeasurements = await Promise.all(
        results.map(async (result: any) => {
          try {
            console.log(`Fetching measurements for result ${result.id}: ${result.resultName}`);
            const measurementsResponse = await axios.get(
              `http://localhost:1337/api/measurements?filters[lab_result][id][$eq]=${result.id}&pagination[pageSize]=1000&sort=dateTime:asc`
            );
            
            console.log(`Found ${measurementsResponse.data.data?.length || 0} measurements for ${result.resultName}`);
            
            return {
              ...result,
              measurements: measurementsResponse.data.data || []
            };
          } catch (error) {
            console.error(`Error fetching measurements for result ${result.id}:`, error);
            return {
              ...result, 
              measurements: []
            };
          }
        })
      );
      
      const filteredResults = resultsWithMeasurements.filter((result: any) => 
        result.measurements && result.measurements.length > 0
      );
      
      // Deduplicate results by resultName and merge their measurements
      const deduplicatedResults = filteredResults.reduce((acc: any[], current: any) => {
        const existingResult = acc.find(result => 
          result.resultName === current.resultName && result.unit === current.unit
        );
        
        if (existingResult) {
          // Merge measurements from duplicate results
          existingResult.measurements = [...existingResult.measurements, ...current.measurements];
        } else {
          // Add new unique result
          acc.push({
            ...current,
            measurements: [...current.measurements]
          });
        }
        
        return acc;
      }, []);
      
      // Sort measurements by date for each result
      deduplicatedResults.forEach((result: any) => {
        result.measurements.sort((a: any, b: any) => 
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );
      });
      
      console.log(`Deduplicated ${filteredResults.length} results to ${deduplicatedResults.length} unique results`);
      deduplicatedResults.forEach((result: any) => {
        console.log(`- ${result.resultName} (${result.unit}): ${result.measurements.length} measurements`);
      });
      
      setLabResults(deduplicatedResults);
      setSelectedResults([]); // Clear previous selections
    } catch (error) {
      console.error('Error fetching lab results:', error);
      
      // Show error details for debugging
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          // @ts-ignore
          response: error.response?.data,
          // @ts-ignore  
          status: error.response?.status
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelection = (group: LabResultGroup) => {
    console.log('Group selected:', group);
    setSelectedGroupId(group.id);
    setSelectedGroupName(group.groupName);
    setSelectedResults([]);
    setAggregatedData([]);
  };

  const handleResultToggle = (result: LabResult) => {
    console.log('Toggling result:', result);
    const isSelected = selectedResults.some(r => r.id === result.id);
    
    if (isSelected) {
      const newSelected = selectedResults.filter(r => r.id !== result.id);
      setSelectedResults(newSelected);
    } else {
      const newSelected = [...selectedResults, result];
      setSelectedResults(newSelected);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
          <p className="mt-4 text-lg text-gray-600">Labresultaten laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen p-5">
      <h1 className="text-3xl font-bold text-blue-900 border-b-4 border-blue-900 w-1/2 text-center mb-8 mx-auto flex-shrink-0">
        Labresultaten Analyse
      </h1>

      <div className="flex w-full space-x-4 flex-1 min-h-0">
        {/* Left sidebar - Groups */}
        <div className="w-1/4 min-w-0 flex-shrink-0 bg-white rounded-lg shadow-lg flex flex-col">
          <div className="p-6 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Categorieën</h2>
            
            {/* Debug info */}
            {labGroups.length === 0 && !loading && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  Geen categorieën gevonden. Controleer of de backend draait en data beschikbaar is.
                </p>
                <button
                  onClick={() => {
                    console.log('Refreshing lab groups...');
                    setLabGroups([]);
                    setSelectedResults([]);
                    setAggregatedData([]);
                    fetchLabGroups();
                  }}
                  className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded text-yellow-800"
                >
                  🔄 Opnieuw laden
                </button>
              </div>
            )}
          </div>
          
          {/* Lab Groups - Scrollable */}
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            <div className="space-y-2">
              {labGroups.length > 0 ? (
                labGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelection(group)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedGroupId === group.id
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{group.groupName}</span>
                      <span className="text-sm text-gray-500">({group.resultCount})</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">📊</div>
                  <p className="text-sm">Geen labresultaat categorieën beschikbaar</p>
                  <p className="text-xs mt-1">Controleer de backend connectie</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle panel - Measurements */}
        <div className="w-1/4 min-w-0 flex-shrink-0 bg-white rounded-lg shadow-lg flex flex-col">
          <div className="p-6 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedGroupId ? `${selectedGroupName} - Metingen` : 'Selecteer Categorie'}
            </h2>
          </div>
          
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            {selectedGroupId ? (
              labResults.length > 0 ? (
                <div className="space-y-2">
                  {labResults.map(result => (
                    <label
                      key={result.id}
                      className="flex items-center p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedResults.some(r => r.id === result.id)}
                        onChange={() => handleResultToggle(result)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{result.resultName}</div>
                        <div className="text-xs text-gray-500">
                          {result.unit} • {result.measurements?.length || 0} metingen
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Geen metingen beschikbaar voor deze categorie</p>
                  {!loading && (
                    <button
                      onClick={() => {
                        console.log('Refreshing lab results for group:', selectedGroupId);
                        if (selectedGroupId) {
                          fetchLabResultsForGroup(selectedGroupId);
                        }
                      }}
                      className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded text-blue-800 mt-2"
                    >
                      🔄 Opnieuw proberen
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2">🧪</div>
                <p className="text-sm">Selecteer een categorie om metingen te bekijken</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Visualization */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedResults.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <svg ref={svgRef}></svg>
              </div>
              
              {/* Summary table */}
              <div className="mt-6 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Samenvatting</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Labresultaat
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Totaal Metingen
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Gemiddelde
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Eenheid
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedResults.map(result => {
                        const resultData = aggregatedData.filter(d => d.resultName === result.resultName);
                        const totalMeasurements = resultData.reduce((sum, d) => sum + d.measurementCount, 0);
                        const overallAverage = resultData.length > 0
                          ? resultData.reduce((sum, d) => sum + d.averageValue, 0) / resultData.length
                          : 0;
                        
                        return (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {result.resultName}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {totalMeasurements}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {overallAverage.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {result.unit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                {labGroups.length === 0 ? (
                  <>
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Geen Data Beschikbaar
                    </h3>
                    <p className="text-sm">
                      Er zijn geen labresultaat categorieën gevonden. Controleer of de backend draait en data beschikbaar is.
                    </p>
                  </>
                ) : selectedGroupId === null ? (
                  <>
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Selecteer een Categorie
                    </h3>
                    <p className="text-sm">
                      Kies een categorie uit het linkerpaneel om de beschikbare labresultaten te bekijken.
                    </p>
                  </>
                ) : (
                  <>
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Selecteer Labresultaten
                    </h3>
                    <p className="text-sm">
                      Kies eerst een categorie en selecteer vervolgens de labresultaten die je wilt analyseren.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Labresultaten; 