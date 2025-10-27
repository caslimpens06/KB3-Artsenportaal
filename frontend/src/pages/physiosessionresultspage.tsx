import React from "react";

const Physiosessionresultspage: React.FC = () => {
  return (
    <div className="w-4/5 mx-auto my-5 bg-white rounded-lg shadow-lg">
      <div className="p-5 border-b border-gray-300">
        <h2 className="text-xl text-blue-900">Resultaten scan</h2>
      </div>
      <div className="p-5 max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
        <h3 className="text-blue-900">Myometrie uitslagen</h3>
        <table className="w-full table-auto mt-5">
          <thead>
            <tr>
              <th className="text-left text-blue-900 p-3 bg-gray-100 sticky top-0">Aspect</th>
              <th className="text-left text-blue-900 p-3 bg-gray-100 sticky top-0">Mini Titel</th>
              <th className="text-left text-blue-900 p-3 bg-gray-100 sticky top-0">Mini Titel</th>
              <th className="text-left text-blue-900 p-3 bg-gray-100 sticky top-0">Mini Titel</th>
              <th className="text-left text-blue-900 p-3 bg-gray-100 sticky top-0"></th>
            </tr>
          </thead>
          <tbody>
            {["Schouder", "Heup", "Knie", "Enkel", "Pols", "Rug", "Nek"].map((bodyPart, index) => (
              ["Links", "Rechts"].map((side, idx) => (
                <tr key={`${side}-${bodyPart}`}>
                  <td className="p-3">{side}</td>
                  <td className="p-3">{bodyPart}</td>
                  <td className="p-3">{35 + index + idx * 5}/50</td>
                  <td className="p-3">{32 + index + idx * 5}/50</td>
                  <td className="p-3">
                    <button className="bg-blue-900 text-white p-2 rounded-md hover:bg-blue-800">
                      🔍
                    </button>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Physiosessionresultspage;
