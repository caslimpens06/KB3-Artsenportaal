import React, { useState } from "react";
import DashboardSettings from "../components/dashboardsettings";
import ProfileSetting from "../components/profilesettings";
import MeldingSettings from "../components/meldingsettings";
import LogboekSettings from "../components/logboeksettings";

const SettingsPage: React.FC = () => {
	const [selectedItem, setSelectedItem] = useState<string>("Profiel");
	const user = {
		firstName: "Levi",
		lastName: "Noah",
		phone: "06-40440411",
		email: "levi.noah@mockdata.nl",
		jobtitle: "Arts",
		specialist: "juvenile dermatomyositis",
		location: "Universitair Medisch Centrum Utrecht",
	};

	const handleNavClick = (item: string) => {
		setSelectedItem(item);
	};

	return (
		<div className="bg-[#d8eaff] h-full m-0">
			<main>
				<h1 className="w-[300px] h-[61px] font-bold text-[#000369] py-[34px] pl-[10px] ml-[34px] border-b-3 border-[#000369]">
					Instellingen
				</h1>
				<div className="flex gap-8 w-[1164px] h-[858px] pl-[34px]">
					<nav className="bg-[#000369] flex flex-col w-[259px] h-[858px] rounded-l-[57px] ml-[34px] mt-[41px] text-white">
						<ul>
							<li
								id="Profiel"
								className={`flex mt-5 items-center pl-[60px] pt-[3px] text-[25px] font-semibold ${
									selectedItem === "Profiel" ? "opacity-100" : "opacity-30"
								}`}
								onClick={() => handleNavClick("Profiel")}
							>
								Profiel
							</li>
							<li
								id="Meldingen"
								className={`flex mt-5 items-center pl-[60px] pt-[3px] text-[25px] font-semibold ${
									selectedItem === "Meldingen" ? "opacity-100" : "opacity-30"
								}`}
								onClick={() => handleNavClick("Meldingen")}
							>
								Meldingen
							</li>
							<li
								id="Logboek"
								className={`flex mt-5 items-center pl-[60px] pt-[3px] text-[25px] font-semibold ${
									selectedItem === "Logboek" ? "opacity-100" : "opacity-30"
								}`}
								onClick={() => handleNavClick("Logboek")}
							>
								Logboek
							</li>
							<li
								id="Dashboard"
								className={`flex mt-5 items-center pl-[60px] pt-[3px] text-[25px] font-semibold ${
									selectedItem === "Dashboard Instellingen" ? "opacity-100" : "opacity-30"
								}`}
								onClick={() => handleNavClick("Dashboard Instellingen")}
							>
								Dashboard Instellingen
							</li>
						</ul>
					</nav>
					<div className="mt-[2.5rem] w-[55%]">
						{selectedItem === "Profiel" && <ProfileSetting user={user} />}
						{selectedItem === "Meldingen" && <MeldingSettings />}
						{selectedItem === "Logboek" && <LogboekSettings />}
						{selectedItem === "Dashboard Instellingen" && <DashboardSettings />}
					</div>
				</div>
			</main>
		</div>
	);
};

export default SettingsPage;
