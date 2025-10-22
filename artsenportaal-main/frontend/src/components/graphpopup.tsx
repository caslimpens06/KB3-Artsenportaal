import React, { useState } from "react";

declare global {
  interface Window {
    selectedElements: string[];
    selectedElement: string;
  }
}

export interface GraphPopupProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const GraphPopup: React.FC<GraphPopupProps> = ({ isOpen, onClose }) => {
  const [selectedElements, setSelectedElements] = useState<string[]>(['Kalium']);

  const handleCheckboxChange = (element: string) => {
    setSelectedElements(prev => 
      prev.includes(element) ? prev.filter(e => e !== element) : [...prev, element]
    );
  };

  React.useEffect(() => {
    if (isOpen) {
      window.selectedElements = selectedElements;
      loadScripts(selectedElements);
    }
  }, [isOpen, selectedElements]);

  const loadScripts = async (elements: string[]) => {
    const existingD3 = document.querySelector('script[src*="d3.v7.min.js"]');
    const existingLab = document.querySelector('script[src*="labscript.js"]');

      if (!existingD3) {
        const d3Script = document.createElement('script');
        d3Script.src = 'https://d3js.org/d3.v7.min.js';
        d3Script.async = true;
        document.body.appendChild(d3Script);

      d3Script.onload = () => {
        if (!existingLab) {
          const labScript = document.createElement('script');
          labScript.src = '/d3-graphs/patientxgraph/labscript.js';
          document.body.appendChild(labScript);
        }
      };
    } else if (!existingLab) {
      const labScript = document.createElement('script');
      labScript.src = '/d3-graphs/patientxgraph/labscript.js';
      document.body.appendChild(labScript);
    }

    window.selectedElements = elements;
    window.selectedElement = elements[0];
    // Trigger a redraw of the chart
    if ((window as any).redrawChart) {
      (window as any).redrawChart();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-11/12 h-4/5 max-w-7xl"
        onClick={(e) => e.stopPropagation()}
      >
        <label>
          <input 
            type="checkbox" 
            checked={selectedElements.includes('Kalium')} 
            onChange={() => handleCheckboxChange('Kalium')} 
          />
          Kalium
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={selectedElements.includes('Natrium')} 
            onChange={() => handleCheckboxChange('Natrium')} 
          />
          Natrium
        </label>
        <div id="chart-container">
          <style>
            {`
              rect {
                pointer-events: all;
                fill-opacity: 0;
                stroke-opacity: 0;
                z-index: 1;
              }

              .tooltip {
                position: absolute;
                padding: 10px;
                background-color: steelblue;
                color: white;
                border: 1px solid white;
                border-radius: 10px;
                display: none;
                opacity: .75;
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default GraphPopup;
