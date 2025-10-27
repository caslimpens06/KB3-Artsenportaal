import React, { useState } from "react";

interface SettingStatus {
  status: boolean;
}

const SettingSwitch: React.FC<SettingStatus> = ({ status }) => {
  const [switchState, setSwitchState] = useState<boolean>(status);

  return (
    <label className="relative inline-block w-12 h-6">
      <input
        id="switch-default-checkbox"
        type="checkbox"
        className="opacity-0 w-0 h-0 absolute"
        onClick={() => {
          setSwitchState(!switchState);
        }}
      />
      <span
        className={`block w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${
          switchState ? "bg-blue-500" : "bg-gray-300"
        }`}
      ></span>
      <span
        className={`absolute top-0 left-0 w-6 h-6 bg-white rounded-full transition-all duration-300 ease-in-out transform ${
          switchState ? "translate-x-full" : ""
        }`}
      ></span>
    </label>
  );
};

export default SettingSwitch;
