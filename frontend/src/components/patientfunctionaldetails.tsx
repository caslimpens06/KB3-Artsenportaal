import React from "react";

const PatientFunctionalDetails: React.FC = () => {
	return (
		<div className="flex flex-col font-sans">
			<div className="flex justify-between items-center bg-blue-200 p-4">
				<h1 className="m-0">Vandaag, 24 Juni</h1>
				<select className="p-2">
					<option>April 2021</option>
					<option>Mei 2021</option>
					<option>Juni 2021</option>
				</select>
			</div>

			<div className="flex justify-between p-5">
				<div className="flex-1 flex flex-col mx-2">
					<div className="mb-4">
						<h2 className="text-lg font-semibold">Functionele gegevens</h2>
						<div className="myometric-results mb-4">
							<h3 className="font-medium">Myometrie Resultaten</h3>
							<div className="grid grid-cols-2 gap-5">
								{[...Array(6)].map((_, index) => (
									<div key={index} className="bg-orange-500 p-3 text-center text-white rounded-lg">
										Linkerarm
										<br />
										28/50
									</div>
								))}
							</div>
						</div>

						<div className="cmas-result mb-4">
							<h3 className="font-medium">CMAS resultaat</h3>
							<div className="bg-indigo-800 p-3 text-center text-white rounded-lg">
								CMAS mei
								<br />
								32/50
							</div>
						</div>
					</div>

					<div className="mb-4">
						<h2 className="text-lg font-semibold">Medische gegevens</h2>
						<div className="ck-values flex flex-col">
							{[...Array(4)].map((_, index) => (
								<div key={index} className="ck-row flex justify-between mb-2">
									<div className="ck-value bg-white p-3 text-center text-blue-700 rounded-lg flex justify-between items-center border border-orange-500 flex-1">
										<span className="ck-left">CK</span>
										<span className="ck-right">0-145 U/L</span>
									</div>
									<div className="ck-number bg-orange-500 p-3 text-center text-white rounded-lg flex-1 flex justify-center items-center">
										<span>100</span>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="hero-calendar mb-4">
						<h2 className="text-lg font-semibold">Hero Kalender</h2>
						<div className="calendar-icons flex justify-around mb-2">
							<span className="text-2xl">📅</span>
							<span className="text-2xl">📅</span>
							<span className="text-2xl">📅</span>
						</div>
						<textarea className="w-full h-12 p-3 border rounded-lg border-gray-300" placeholder="Opmerking"></textarea>
					</div>
				</div>

				<div className="flex-1 flex flex-col mx-2">
					<div className="charts">
						<h2 className="text-lg font-semibold">Grafieken</h2>
						{["Score Vergelijking", "CMAS mei", "Laboratoriumwaarden", "Emotiescore"].map((chartTitle, index) => (
							<div key={index} className="mb-4">
								<h3 className="font-medium">{chartTitle}</h3>
								<img src={`chart${index + 1}.png`} alt={`${chartTitle} grafiek`} className="w-full" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PatientFunctionalDetails;
