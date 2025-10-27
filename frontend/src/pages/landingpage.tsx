import React, { useEffect } from "react";

const LandingPage: React.FC = () => {
	useEffect(() => {
		document.title = "SGACP";
	}, []);
	
	return (
		<div className="font-sans text-center text-gray-800">
			<header className="bg-[#16a0d6] text-white py-12 px-5">
				<h1 className="text-4xl m-0">Super Gave Artsen Connect Portaal.</h1>
				<p className="text-2xl my-2">SGACP</p>
				<p className="text-xl mt-4">Jouw gezondheid, Onze verantwoordelijkheid</p>
			</header>
			<section className="flex justify-around py-12 px-5">
				<div className="max-w-xs border-2 border-dashed border-black p-5 rounded-lg">
					<h2 className="text-3xl mb-3">Patienten Dossier</h2>
					<p className="text-xl text-gray-600">Het dossier van alle patiënten voor de artsen.</p>
					<li className="mt-4">
						<a className="text-blue-600 hover:underline" href="./patients">
							Patienten
						</a>
					</li>
				</div>
				<div className="max-w-xs border-2 border-dashed border-black p-5 rounded-lg">
					<h2 className="text-3xl mb-3">Artsen Dossier</h2>
					<p className="text-xl text-gray-600">Bekijk al onze artsen.</p>
					<li className="mt-4">
						<a className="text-blue-600 hover:underline" href="/artsen">
							Artsen
						</a>
					</li>
				</div>
				<div className="max-w-xs border-2 border-dashed border-black p-5 rounded-lg">
					<h2 className="text-3xl mb-3">About Us</h2>
					<p className="text-xl text-gray-600">Wie zijn wij en wat doen wij.</p>
					<li className="mt-4">
						<a className="text-blue-600 hover:underline" href="/aboutus">
							About Us
						</a>
					</li>
				</div>
				<div className="max-w-xs border-2 border-dashed border-black p-5 rounded-lg">
					<h2 className="text-3xl mb-3">Dashboard</h2>
					<p className="text-xl text-gray-600">Navigatie Dashboard</p>
					<li className="mt-4">
						<a className="text-blue-600 hover:underline" href="/dashboardpage">
							Dashboard
						</a>
					</li>
				</div>
			</section>
		</div>
	);
};

export default LandingPage;
