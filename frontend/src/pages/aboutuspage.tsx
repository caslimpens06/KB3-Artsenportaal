import React from "react";

const AboutUsPage: React.FC = () => {
	return (
		<div className="font-sans text-center p-8 bg-yellow-50 text-gray-800">
			{/* <h1 id="title">About Us</h1> wordt gebruik */}
			<h1 className="text-4xl mb-6">About Us</h1>
			<p className="text-xl text-gray-600 mb-4">Wie zijn wij?</p>
			<p className="text-lg text-gray-500">
				Wij zijn de klas B2C van de ICT Academie op Hogeschool Zuyd. Onze klas is opgedeeld in 5 project teams die samen aan dit portaal werken.
			</p>
		</div>
	);
};

export default AboutUsPage;
