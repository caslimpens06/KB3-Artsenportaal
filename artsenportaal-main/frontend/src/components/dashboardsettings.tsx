import React from "react";
import SettingsElement from "./settingselement";

const DashboardSettings: React.FC = () => {
	return (
		<div className="bg-blue-200 rounded-xl h-4/5 p-4 w-full">
			<div className="bg-white rounded-lg">
				<SettingsElement status={false} title="Compact mode" />
				<SettingsElement status={false} title="Dark theme" />
			</div>
		</div>
	);
};

export default DashboardSettings;
