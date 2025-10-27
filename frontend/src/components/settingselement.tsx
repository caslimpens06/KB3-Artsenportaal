import React from "react";
import SettingSwitch from "./switchsettings";

interface SettingStatus {
  status: boolean;
  title: string;
}

const SettingsElement: React.FC<SettingStatus> = ({ status, title }) => {
  return (
    <div className="flex justify-between items-center bg-[#d8eaff] p-4 rounded-lg w-11/12 mb-4">
      <p className="text-xl font-medium">{title}</p>
      <SettingSwitch status={false} />
    </div>
  );
};

export default SettingsElement;
