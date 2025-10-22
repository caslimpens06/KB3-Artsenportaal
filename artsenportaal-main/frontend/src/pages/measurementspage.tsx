import React, { useState } from 'react';
import MeasurementTabBar from '../components/measurementstabbar';
import MeasurementList from '../components/measurementslist';
import BloodTabBar from '../components/bloodtabbar';

const MeasurementsPage: React.FC = () => {
  const [selectedBloodTab, setSelectedBloodTab] = useState<string>('Bloed');
  const [selectedMainTab, setSelectedMainTab] = useState<string>('Bloed');
  
  const bloodMeasurements = {
    Bloed: [
      { id: 1, name: 'Kalium', value: '138 mmol/L', range: '3,5 - 5 mmol/L' },
      { id: 2, name: 'CK-Waarde', value: '99 U/L', range: '<200 U/L' },
    ],
    Haematologie: [
      { id: 1, name: 'Hemoglobine', value: '8.7 mmol/L', range: '8,5 - 11 mmol/L' },
      { id: 2, name: 'Hematocriet', value: '0.42 L/L', range: '<0,50 l/l' },
    ]
  };

  const labMeasurements = [
    { id: 1, name: 'Galectin-9', value: '12.3 pg/mL', range: '2 - 9 ng/ml' },
    { id: 2, name: 'CXCL10', value: '456 pg/mL', range: '100 - 200 pg/ml' },
  ];

  const cmasMeasurements = [
    { id: 1, name: 'Head elevation', value: '2 punten', range: 'x' },
    { id: 2, name: 'Leg raise/ Touch object', value: '3 punten', range: 'x' },
  ];

  const radiologyMeasurements = [
    { id: 1, name: 'Thorax', value: 'Röntgenfoto', range: 'x' },
    { id: 2, name: 'Knie links', value: 'Röntgenfoto', range: 'x' },
    { id: 3, name: 'Knie rechts', value: 'Röntgenfoto', range: 'x' },
    { id: 4, name: 'Enkel links', value: 'Röntgenfoto', range: 'x' },
    { id: 5, name: 'Heup', value: 'Röntgenfoto', range: 'x' },
  ];

  const displayedMeasurements = 
    selectedMainTab === 'Lab' ? labMeasurements :
    selectedMainTab === 'CMAS' ? cmasMeasurements :
    selectedMainTab === 'Radiologie' ? radiologyMeasurements :
    bloodMeasurements[selectedBloodTab as keyof typeof bloodMeasurements];

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, padding: '20px' }}>
        <div role="tablist" aria-label="main tabs">
          <MeasurementTabBar
            tabs={['Bloed', 'Radiologie', 'CMAS', 'Lab']}
            selectedTab={selectedMainTab}
            onTabClick={(tab) => setSelectedMainTab(tab)}
            tabGroupName="main"
          />
        </div>
        {selectedMainTab === 'Bloed' && (
          <div role="tablist" aria-label="blood tabs">
            <BloodTabBar
              tabs={['Bloed', 'Haematologie']}
              selectedTab={selectedBloodTab}
              onTabClick={setSelectedBloodTab}
              tabGroupName="blood"
            />
          </div>
        )}
        <MeasurementList 
          measurements={displayedMeasurements}
          onChartClick={(id) => console.log('Chart clicked:', id)}
          currentTab={selectedMainTab}
        />
      </div>
    </div>
  );
};

export default MeasurementsPage;
