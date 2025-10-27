import React from "react";
import GraphPopup from './graphpopup';
import RadiologyPopup from './radiologypopup';
import { useState } from 'react';

interface Measurement {
    id: number;
    name: string;
    value: string;
    range: string;
}

export interface MeasurementListProps {
    measurements: Measurement[];
    onChartClick: (id: number) => void;
    currentTab?: string;
}

const MeasurementList: React.FC<MeasurementListProps> = ({ measurements, onChartClick, currentTab }) => {
    const [isGraphPopupOpen, setIsGraphPopupOpen] = useState(false);
    const [isRadiologyPopupOpen, setIsRadiologyPopupOpen] = useState(false);
    const [selectedMeasurementId, setSelectedMeasurementId] = useState<number | null>(null);

    const handleChartClick = (id: number) => {
        setSelectedMeasurementId(id);
        if (currentTab === 'Radiologie') {
            setIsRadiologyPopupOpen(true);
        } else {
            setIsGraphPopupOpen(true);
        }
        onChartClick(id);
    };

    return (
        <div className="overflow-auto h-screen pl-0 pr-4 py-4">
            <h4 className="text-left py-4 px-4 text-lg text-[#000369] underline">Alle metingen</h4>
            <div className="flex justify-between px-2.5 text-[#000369] w-full">
                <div className="grid grid-cols-4 w-full rounded-[20px] pl-8">
                    <div>Naam</div>
                    <div>Waarde</div>
                    <div>Bereik</div>
                    <div>Actie</div>
                </div>
            </div>
            {measurements.map((measurement) => (
                <div key={measurement.id} className="w-full">
                    <div className="p-2.5 bg-[#e0f2fe] mb-2.5 rounded-[10px]">
                        <div className="grid grid-cols-4 bg-white p-2.5 rounded-[20px]">
                            <div className="text-[#000369] font-bold p-1.5 rounded">{measurement.name}</div>
                            <div className="text-[#000369] font-bold p-1.5 rounded">{measurement.value}</div>
                            <div className="text-[#000369] font-bold p-1.5 rounded">{measurement.range}</div>
                            <div className="text-[#000369] font-bold p-1.5 rounded">
                                <button 
                                    onClick={() => handleChartClick(measurement.id)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                >
                                    {currentTab === 'Radiologie' ? 'Bekijk foto' : 'Grafiek'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <GraphPopup isOpen={isGraphPopupOpen} onClose={() => setIsGraphPopupOpen(false)}>
                <div className="flex items-center justify-center h-full text-3xl font-bold" data-testid="graph-popup-content">
                    Dit is een test voor meting ID: {selectedMeasurementId}
                </div>
            </GraphPopup>

            <RadiologyPopup 
                isOpen={isRadiologyPopupOpen} 
                onClose={() => setIsRadiologyPopupOpen(false)}
                imageUrl="/path/to/radiology/image.jpg"
            />
        </div>
    );
};

export default MeasurementList;