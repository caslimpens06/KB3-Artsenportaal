import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface AggregatedCMASData {
  date: string;
  averageScore: number;
  scoreCount: number;
  highScoreCount: number; // >10
  lowScoreCount: number;  // 4-9
}

interface BiomeasurementSummary {
  resultName: string;
  unit: string;
  averageValue: number;
  minValue: number;
  maxValue: number;
  measurementCount: number;
}

const OnderzoeksDashboard: React.FC = () => {
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [totalCMASScores, setTotalCMASScores] = useState<number>(0);
  const [totalMeasurements, setTotalMeasurements] = useState<number>(0);
  const [cmasData, setCmasData] = useState<AggregatedCMASData[]>([]);
  const [biomeasurements, setBiomeasurements] = useState<BiomeasurementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAggregatedData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all patients
      const patientsResponse = await axios.get('http://localhost:1337/api/patients');
      const patients = patientsResponse.data.data || [];
      setTotalPatients(patients.length);

      // Fetch all CMAS scores
      const cmasResponse = await axios.get('http://localhost:1337/api/cmas-scores?pagination[pageSize]=1000');
      const allCMASScores = cmasResponse.data.data || [];
      setTotalCMASScores(allCMASScores.length);

      // Process CMAS data for aggregation
      const cmasAggregated = aggregateCMASByMonth(allCMASScores);
      setCmasData(cmasAggregated);

      // Fetch lab results with measurements
      const labResultsResponse = await axios.get('http://localhost:1337/api/lab-results?populate[measurements]=*&pagination[pageSize]=1000');
      const labResults = labResultsResponse.data.data || [];
      
      // Count total measurements and create biomarker summaries
      let measurementCount = 0;
      const biomarkerMap = new Map<string, number[]>();
      
      labResults.forEach((labResult: any) => {
        if (labResult.measurements) {
          measurementCount += labResult.measurements.length;
          
          // Group measurements by result name for averaging
          const resultName = labResult.resultName;
          const unit = labResult.unit;
          
          labResult.measurements.forEach((measurement: any) => {
            const numericValue = parseFloat(measurement.value);
            if (!isNaN(numericValue)) {
              const key = `${resultName}|${unit}`;
              if (!biomarkerMap.has(key)) {
                biomarkerMap.set(key, []);
              }
              biomarkerMap.get(key)!.push(numericValue);
            }
          });
        }
      });
      
      setTotalMeasurements(measurementCount);

      // Create biomarker summaries
      const biomarkerSummaries: BiomeasurementSummary[] = [];
      biomarkerMap.forEach((values, key) => {
        const [resultName, unit] = key.split('|');
        biomarkerSummaries.push({
          resultName,
          unit,
          averageValue: values.reduce((a, b) => a + b, 0) / values.length,
          minValue: Math.min(...values),
          maxValue: Math.max(...values),
          measurementCount: values.length
        });
      });
      
      setBiomeasurements(biomarkerSummaries.slice(0, 10)); // Show top 10

    } catch (error) {
      console.error('Error fetching aggregated data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAggregatedData();
  }, [fetchAggregatedData]);

  const aggregateCMASByMonth = (cmasScores: any[]): AggregatedCMASData[] => {
    const monthlyData = new Map<string, { scores: number[], highCount: number, lowCount: number }>();
    
    cmasScores.forEach(score => {
      const date = new Date(score.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { scores: [], highCount: 0, lowCount: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.scores.push(score.score);
      
      if (score.score > 10) {
        data.highCount++;
      } else if (score.score >= 4) {
        data.lowCount++;
      }
    });

    return Array.from(monthlyData.entries())
      .map(([date, data]) => ({
        date,
        averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        scoreCount: data.scores.length,
        highScoreCount: data.highCount,
        lowScoreCount: data.lowCount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
          <p className="mt-4 text-lg text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full p-5">
      <h1 className="text-3xl font-bold text-blue-900 border-b-4 border-blue-900 w-1/2 text-center mb-8">
        Onderzoek Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-700">Totaal Patiënten</h2>
              <p className="text-3xl font-bold text-blue-600">{totalPatients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.239" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-700">CMAS Scores</h2>
              <p className="text-3xl font-bold text-green-600">{totalCMASScores}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-700">Metingen</h2>
              <p className="text-3xl font-bold text-purple-600">{totalMeasurements}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* CMAS Trends Section */}
      <div className="w-full max-w-6xl mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">CMAS Score Trends (Maandelijks Gemiddelde)</h2>
          {cmasData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Gemiddelde Scores per Maand</h3>
                <div className="space-y-2">
                  {cmasData.slice(-6).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{item.date}</span>
                      <span className="text-blue-600 font-bold">{item.averageScore.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Score Verdeling</h3>
                <div className="space-y-2">
                  {cmasData.slice(-6).map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{item.date}</span>
                        <span className="text-sm text-gray-600">Totaal: {item.scoreCount}</span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-green-600">Hoog ({'>'}10): {item.highScoreCount}</span>
                        <span className="text-orange-600">Laag (4-9): {item.lowScoreCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Geen CMAS data beschikbaar</p>
          )}
        </div>
      </div>

      {/* Lab Results Summaries */}
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Labresultaten Overzicht</h2>
          {biomeasurements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Labresultaat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eenheid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gemiddelde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bereik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aantal Metingen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {biomeasurements.map((biomarker, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {biomarker.resultName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {biomarker.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {biomarker.averageValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {biomarker.minValue.toFixed(2)} - {biomarker.maxValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {biomarker.measurementCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Geen biomerker data beschikbaar</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnderzoeksDashboard; 