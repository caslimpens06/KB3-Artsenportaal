import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

interface CMASScore {
  id: number;
  date: string;
  score: number;
  category: string;
  patient?: {
    id: number;
    name: string;
    patientId: string;
  };
}

interface MonthlyData {
  month: string;
  averageScore: number;
  highScoreCount: number;
  lowScoreCount: number;
  totalCount: number;
}

interface SessionData {
  sessionNumber: number;
  score: number;
  date: string;
  category: string;
  patientCount?: number;
  scoreRange?: {
    min: number;
    max: number;
    std: number;
  };
}

type TabType = 'date' | 'session';

const CMASAnalyse: React.FC = () => {
  const [cmasData, setCmasData] = useState<CMASScore[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('date');
  const svgRef = useRef<SVGSVGElement>(null);

  const processMonthlyData = (scores: CMASScore[]): MonthlyData[] => {
    const monthlyMap = new Map<string, { scores: number[], highCount: number, lowCount: number }>();

    scores.forEach(score => {
      const date = new Date(score.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { scores: [], highCount: 0, lowCount: 0 });
      }
      
      const data = monthlyMap.get(monthKey)!;
      data.scores.push(score.score);
      
      if (score.score > 10) {
        data.highCount++;
      } else if (score.score >= 4) {
        data.lowCount++;
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        highScoreCount: data.highCount,
        lowScoreCount: data.lowCount,
        totalCount: data.scores.length
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const processSessionData = (scores: CMASScore[]): SessionData[] => {
    console.log(`Processing ${scores.length} total CMAS scores for session analysis`);
    
    // Group scores by actual patient
    const scoresByPatient = new Map<string, CMASScore[]>();
    
    scores.forEach(score => {
      // Use patient ID if available, otherwise fallback to a grouping method
      const patientKey = score.patient ? 
        `${score.patient.id}_${score.patient.name}` : 
        `unknown_${score.category}_${Math.floor(new Date(score.date).getTime() / (1000 * 60 * 60 * 24 * 30))}`; // Group by month if no patient
      
      if (!scoresByPatient.has(patientKey)) {
        scoresByPatient.set(patientKey, []);
      }
      scoresByPatient.get(patientKey)!.push(score);
    });
    
    // Sort each patient's scores chronologically and assign session numbers
    const patientSessions = new Map<string, CMASScore[]>();
    scoresByPatient.forEach((patientScores, patientKey) => {
      const sortedScores = patientScores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      patientSessions.set(patientKey, sortedScores);
    });
    
    // Find the maximum number of sessions any patient has
    const maxSessions = Math.max(...Array.from(patientSessions.values()).map(scores => scores.length));
    const patientCount = patientSessions.size;
    
    console.log(`Found ${patientCount} patients with maximum ${maxSessions} sessions`);
    console.log('Patient session counts:', 
      Array.from(patientSessions.entries()).map(([key, scores]) => 
        `${key.split('_')[1] || 'Unknown'}: ${scores.length} sessions`
      )
    );
    
    // Create session data for each session number up to maxSessions
    const sessionData: SessionData[] = [];
    
    for (let sessionNumber = 1; sessionNumber <= maxSessions; sessionNumber++) {
      const sessionScores: number[] = [];
      let patientsWithThisSession = 0;
      const sessionDates: string[] = [];
      
      // Collect scores from all patients who have this session
      patientSessions.forEach((patientScores, patientKey) => {
        if (patientScores.length >= sessionNumber) {
          sessionScores.push(patientScores[sessionNumber - 1].score);
          sessionDates.push(patientScores[sessionNumber - 1].date);
          patientsWithThisSession++;
        }
      });
      
      if (sessionScores.length > 0) {
        const avgScore = sessionScores.reduce((sum, score) => sum + score, 0) / sessionScores.length;
        const minScore = Math.min(...sessionScores);
        const maxScore = Math.max(...sessionScores);
        const variance = sessionScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / sessionScores.length;
        const stdDev = Math.sqrt(variance);
        
        // Use middle date as representative
        const sortedDates = sessionDates.sort();
        const representativeDate = sortedDates[Math.floor(sortedDates.length / 2)];
        
        sessionData.push({
          sessionNumber,
          score: avgScore,
          date: representativeDate,
          category: `Gem. van ${patientsWithThisSession} patiënt${patientsWithThisSession === 1 ? '' : 'en'}`,
          patientCount: patientsWithThisSession,
          scoreRange: {
            min: minScore,
            max: maxScore,
            std: stdDev
          }
        });
      }
    }
    
    console.log(`Final session data contains ${sessionData.length} sessions`);
    console.log('Patient count per session:', sessionData.map(s => `S${s.sessionNumber}: ${s.patientCount} patients`));
    
    return sessionData;
  };

  const fetchCMASData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:1337/api/cmas-scores?pagination[pageSize]=1000&populate=patient');
      const scores: CMASScore[] = response.data.data?.map((item: any) => ({
        id: item.id,
        date: item.date || item.scoreDate,
        score: item.score,
        category: item.category || item.scoreCategory,
        patient: item.patient ? {
          id: item.patient.id,
          name: item.patient.name,
          patientId: item.patient.patientId
        } : undefined
      })) || [];
      setCmasData(scores);

      // Process data for both monthly and session aggregation
      const monthly = processMonthlyData(scores);
      const sessions = processSessionData(scores);
      setMonthlyData(monthly);
      setSessionData(sessions);
    } catch (error) {
      console.error('Error fetching CMAS data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDateVisualization = useCallback(() => {
    if (!svgRef.current || monthlyData.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 150, bottom: 60, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(monthlyData.map(d => d.month))
      .range([0, width])
      .padding(0.1);

    const yScaleScore = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, d => d.averageScore) || 52])
      .range([height, 0]);

    const yScaleCount = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, d => d.totalCount) || 100])
      .range([height, 0]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g')
      .call(d3.axisLeft(yScaleScore));

    svg.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(d3.axisRight(yScaleCount));

    // Add axis labels
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#2563eb')
      .text('Gemiddelde CMAS Score');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', width + margin.right - 20)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#059669')
      .text('Aantal Scores');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text('CMAS Score Trends per Maand');

    // Line for average scores
    const line = d3.line<MonthlyData>()
      .x(d => xScale(d.month)! + xScale.bandwidth() / 2)
      .y(d => yScaleScore(d.averageScore))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(monthlyData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add dots for average scores
    svg.selectAll('.avg-dot')
      .data(monthlyData)
      .enter()
      .append('circle')
      .attr('class', 'avg-dot')
      .attr('cx', d => xScale(d.month)! + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleScore(d.averageScore))
      .attr('r', 5)
      .attr('fill', '#2563eb')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Add bars for total count
    svg.selectAll('.count-bar')
      .data(monthlyData)
      .enter()
      .append('rect')
      .attr('class', 'count-bar')
      .attr('x', d => xScale(d.month)!)
      .attr('y', d => yScaleCount(d.totalCount))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScaleCount(d.totalCount))
      .attr('fill', '#059669')
      .attr('opacity', 0.3);

    // Add interactive tooltips
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

    // Add hover events to dots
    svg.selectAll('.avg-dot')
      .on('mouseover', (event: any, d: unknown) => {
        const data = d as MonthlyData;
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <strong>Maand:</strong> ${data.month}<br/>
          <strong>Gem. Score:</strong> ${data.averageScore.toFixed(2)}<br/>
          <strong>Totaal:</strong> ${data.totalCount}<br/>
          <strong>Hoog (>10):</strong> ${data.highScoreCount}<br/>
          <strong>Laag (4-9):</strong> ${data.lowScoreCount}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Add hover events to bars
    svg.selectAll('.count-bar')
      .on('mouseover', (event: any, d: unknown) => {
        const data = d as MonthlyData;
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <strong>Maand:</strong> ${data.month}<br/>
          <strong>Totaal scores:</strong> ${data.totalCount}<br/>
          <strong>Gem. Score:</strong> ${data.averageScore.toFixed(2)}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });
  }, [monthlyData]);

  const createSessionVisualization = useCallback(() => {
    if (!svgRef.current || sessionData.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 150, bottom: 60, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([1, sessionData.length])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, Math.max(52, d3.max(sessionData, d => d.score + (d.scoreRange?.std || 0)) || 52)])
      .range([height, 0]);

    // Add axes with smart tick formatting for large datasets
    const xAxis = d3.axisBottom(xScale);
    if (sessionData.length > 20) {
      // For large datasets, show fewer ticks
      xAxis.ticks(Math.min(10, sessionData.length / 5)).tickFormat(d => `${Math.floor(d as number)}`);
    } else {
      xAxis.tickFormat(d => `${d}`);
    }

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

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
      .style('fill', '#2563eb')
      .text('Gemiddelde CMAS Score');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Sessie Nummer (Chronologische Volgorde)');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(`CMAS Score Trends Over Sessies (${sessionData.length} Sessies - Patient-gebaseerd)`);

    // Add subtitle with patient info
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 4))
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text(`Gemiddeldes gebaseerd op ${Math.max(...sessionData.map(d => d.patientCount || 0))} patiënten (afnemend per sessie)`);

    // Add error bars for standard deviation (if available)
    if (sessionData[0]?.scoreRange) {
      sessionData.forEach(d => {
        if (d.scoreRange) {
          const x = xScale(d.sessionNumber);
          const yTop = yScale(Math.min(d.score + d.scoreRange.std, 52));
          const yBottom = yScale(Math.max(d.score - d.scoreRange.std, 0));
          
          // Error bar line
          svg.append('line')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', yTop)
            .attr('y2', yBottom)
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 1)
            .attr('opacity', 0.6);
          
          // Top cap
          svg.append('line')
            .attr('x1', x - 2)
            .attr('x2', x + 2)
            .attr('y1', yTop)
            .attr('y2', yTop)
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 1)
            .attr('opacity', 0.6);
          
          // Bottom cap
          svg.append('line')
            .attr('x1', x - 2)
            .attr('x2', x + 2)
            .attr('y1', yBottom)
            .attr('y2', yBottom)
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 1)
            .attr('opacity', 0.6);
        }
      });
    }

    // Line for session progression
    const line = d3.line<SessionData>()
      .x(d => xScale(d.sessionNumber))
      .y(d => yScale(d.score))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(sessionData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots for each session - sized by patient count
    const maxPatientCount = Math.max(...sessionData.map(d => d.patientCount || 1));
    const dots = svg.selectAll('.session-dot')
      .data(sessionData)
      .enter()
      .append('circle')
      .attr('class', 'session-dot')
      .attr('cx', d => xScale(d.sessionNumber))
      .attr('cy', d => yScale(d.score))
      .attr('r', d => {
        const baseRadius = sessionData.length > 50 ? 3 : 5;
        const sizeMultiplier = (d.patientCount || 1) / maxPatientCount;
        return baseRadius + (sizeMultiplier * 3); // Scale dot size by patient count
      })
      .attr('fill', d => d.score > 10 ? '#ef4444' : d.score >= 4 ? '#f59e0b' : '#10b981')
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8);

    // Add patient count labels on larger dots
    svg.selectAll('.patient-count-label')
      .data(sessionData.filter(d => (d.patientCount || 0) > 1))
      .enter()
      .append('text')
      .attr('class', 'patient-count-label')
      .attr('x', d => xScale(d.sessionNumber))
      .attr('y', d => yScale(d.score))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '8px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.patientCount || 0);

    // For large datasets, show dots only on hover to reduce clutter
    if (sessionData.length > 100) {
      dots.attr('opacity', 0.3);
    }

    // Add interactive tooltips
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

    // Add hover events to dots
    svg.selectAll('.session-dot')
      .on('mouseover', (event: any, d: unknown) => {
        const data = d as SessionData;
        
        // Highlight the hovered dot
        d3.select(event.target).attr('opacity', 1).attr('r', (d: unknown) => {
          const sessionData = d as SessionData;
          const baseRadius = sessionData.patientCount && sessionData.patientCount > 1 ? 8 : 6;
          return baseRadius;
        });
        
        tooltip.transition().duration(200).style('opacity', 1);
        const tooltipContent = `
          <strong>Sessie:</strong> ${data.sessionNumber}<br/>
          <strong>Gem. Score:</strong> ${data.score.toFixed(1)}<br/>
          <strong>Aantal Patiënten:</strong> ${data.patientCount || 0}<br/>
          ${data.scoreRange ? `<strong>Bereik:</strong> ${data.scoreRange.min.toFixed(1)} - ${data.scoreRange.max.toFixed(1)}<br/>` : ''}
          ${data.scoreRange ? `<strong>Std. Dev:</strong> ${data.scoreRange.std.toFixed(1)}<br/>` : ''}
          <strong>Representatieve Datum:</strong> ${new Date(data.date).toLocaleDateString('nl-NL')}<br/>
          <em>Gemiddelde van ${data.patientCount || 0} patiënt${(data.patientCount || 0) === 1 ? '' : 'en'}</em>
        `;
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', (event: any) => {
        // Reset dot appearance
        const originalData = d3.select(event.target).data()[0] as SessionData;
        const baseRadius = sessionData.length > 50 ? 3 : 5;
        const maxPatientCount = Math.max(...sessionData.map(d => d.patientCount || 1));
        const sizeMultiplier = (originalData.patientCount || 1) / maxPatientCount;
        const originalRadius = baseRadius + (sizeMultiplier * 3);
        
        d3.select(event.target)
          .attr('opacity', sessionData.length > 100 ? 0.3 : 0.8)
          .attr('r', originalRadius);
        
        tooltip.transition().duration(200).style('opacity', 0);
      });
  }, [sessionData]);

  useEffect(() => {
    fetchCMASData();
  }, [fetchCMASData]);

  useEffect(() => {
    if (activeTab === 'date' && monthlyData.length > 0) {
      createDateVisualization();
    } else if (activeTab === 'session' && sessionData.length > 0) {
      createSessionVisualization();
    }
  }, [activeTab, monthlyData, sessionData, createDateVisualization, createSessionVisualization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
          <p className="mt-4 text-lg text-gray-600">CMAS data laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full p-5">
      <h1 className="text-3xl font-bold text-blue-900 border-b-4 border-blue-900 w-1/2 text-center mb-8">
        CMAS Score Analyse
      </h1>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('date')}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            activeTab === 'date'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Datum Analyse
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            activeTab === 'session'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Sessie Progressie
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-6xl mb-8">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Totaal Scores</h3>
          <p className="text-2xl font-bold text-blue-600">{cmasData.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Gemiddelde Score</h3>
          <p className="text-2xl font-bold text-green-600">
            {cmasData.length > 0 ? (cmasData.reduce((sum, score) => sum + score.score, 0) / cmasData.length).toFixed(1) : '0'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500">Hoge Scores ({'>'}10)</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {cmasData.filter(score => score.score > 10).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Lage Scores (4-9)</h3>
          <p className="text-2xl font-bold text-purple-600">
            {cmasData.filter(score => score.score >= 4 && score.score <= 10).length}
          </p>
        </div>
      </div>

      {/* Visualization */}
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg p-6">
        <svg ref={svgRef}></svg>
      </div>

      {/* Data Table */}
      <div className="w-full max-w-6xl mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {activeTab === 'date' ? 'Maandelijks Overzicht' : 'Sessie Overzicht'}
        </h2>
        
        {activeTab === 'session' && sessionData.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Sessie Analyse Samenvatting (Patient-gebaseerd)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Totaal Sessies:</span>
                <span className="ml-2 text-gray-800">{sessionData.length}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Max Patiënten:</span>
                <span className="ml-2 text-gray-800">{Math.max(...sessionData.map(d => d.patientCount || 0))}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Totaal Metingen:</span>
                <span className="ml-2 text-gray-800">{cmasData.length}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Periode:</span>
                <span className="ml-2 text-gray-800">
                  {new Date(Math.min(...cmasData.map(d => new Date(d.date).getTime()))).toLocaleDateString('nl-NL')} - 
                  {new Date(Math.max(...cmasData.map(d => new Date(d.date).getTime()))).toLocaleDateString('nl-NL')}
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              * Sessies zijn gegroepeerd per patiënt. Elke sessie toont het gemiddelde van alle patiënten die die sessie hebben.
            </p>
            <p className="text-xs text-blue-600">
              * Het aantal patiënten neemt af per sessie omdat niet alle patiënten evenveel sessies hebben.
            </p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          {activeTab === 'date' ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gemiddelde Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hoge Scores ({'>'}10)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lage Scores (4-9)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal Scores
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {data.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.averageScore.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.highScoreCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.lowScoreCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.totalCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>
              {sessionData.length > 20 && (
                <p className="text-sm text-gray-600 mb-3">
                  Toont de laatste 20 van {sessionData.length} sessies (volledige data zichtbaar in grafiek)
                </p>
              )}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gem. Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aantal Patiënten
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score Bereik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Std. Afwijking
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessionData.slice(-20).map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.sessionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          data.score > 10 ? 'bg-red-100 text-red-800' :
                          data.score >= 4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {data.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.patientCount || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.scoreRange ? 
                          `${data.scoreRange.min.toFixed(1)} - ${data.scoreRange.max.toFixed(1)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.scoreRange ? data.scoreRange.std.toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMASAnalyse; 