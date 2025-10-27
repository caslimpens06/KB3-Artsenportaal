import React from "react";

const ArtsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-8 bg-green-100 text-gray-800">
      {/* <h1 id="title">Artsen Page</h1> wordt gebruikt voor een rendercheck */}
      <h1
        id="title"
        className="text-4xl font-bold text-gray-800 mb-5"
      >
        Artsen Page
      </h1>
      <p className="text-lg text-gray-600">
        Dit is een pagina voor de artsen, hier kun je zien welke artsen er zijn.
      </p>
    </div>
  );
};

export default ArtsPage;
