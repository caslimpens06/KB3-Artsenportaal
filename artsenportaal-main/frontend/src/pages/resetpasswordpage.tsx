import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  setHideNavbar: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResetPasswordPage: React.FC<Props> = ({ setHideNavbar }) => {
  const [new_password, setNewPassword] = useState("");
  const [check_password, setCheckPassword] = useState("");
  const [min_length, setMinLength] = useState(false);
  const [has_lower_case, setHasLowerCase] = useState(false);
  const [has_upper_case, setHasUpperCase] = useState(false);
  const [has_number, setHasNumber] = useState(false);
  const [has_special_character, setHasSpecialCharacter] = useState(false);
  const [is_verified, setIsVerified] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHideNavbar(true);

    return () => {
      setHideNavbar(false);
    };
  }, [setHideNavbar]);

  const checkSecurityPassword = (newEnteredPassword: string) => {
    setNewPassword(newEnteredPassword);

    setMinLength(newEnteredPassword.length >= 8);
    setHasLowerCase(/[a-z]/.test(newEnteredPassword));
    setHasUpperCase(/[A-Z]/.test(newEnteredPassword));
    setHasNumber(/\d/.test(newEnteredPassword));
    setHasSpecialCharacter(/[!@#$%^&*(),.?":{}|<>]/.test(newEnteredPassword));
    setIsVerified(newEnteredPassword === check_password && newEnteredPassword !== "");
  };

  const checkCheckPassword = (checkEnteredPassword: string) => {
    setCheckPassword(checkEnteredPassword);
    setIsVerified(new_password === checkEnteredPassword && checkEnteredPassword !== "");
  };

  const togglePasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const cancelPasswordReset = () => {
    navigate("/login");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!min_length || !has_lower_case || !has_upper_case || !has_number || !has_special_character || !is_verified) {
      alert("Password entered is invalid make sure all requirements are met!");
    } else {
      alert("Password reset successfully (simulated).");
      navigate("/login");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 p-5">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-center text-2xl font-bold text-blue-900 mb-6">Reset Password</h1>

        <div className="mb-6">
          <label htmlFor="new-password-input" className="block text-lg font-medium text-gray-700 mb-2">New Password</label>
          <div className="relative">
            <input
              id="new-password-input"
              className="w-full p-3 text-base border border-gray-300 rounded-md"
              type={showNewPassword ? "text" : "password"}
              value={new_password}
              onChange={(e) => checkSecurityPassword(e.target.value)}
            />
            <span
              className={`absolute top-1/2 transform -translate-y-1/2 right-3 cursor-pointer ${showNewPassword ? "block" : ""}`}
              onClick={togglePasswordVisibility}
            >
              <img src={showNewPassword ? "Icons/ShowPassword.svg" : "Icons/HidePassword.svg"} alt={showNewPassword ? "👁" : "‒"} className="w-6 h-6" />
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="check-password-input" className="block text-lg font-medium text-gray-700 mb-2">Verify Password</label>
          <input
            id="check-password-input"
            className="w-full p-3 text-base border border-gray-300 rounded-md"
            type="password"
            value={check_password}
            onChange={(e) => checkCheckPassword(e.target.value)}
          />
        </div>

        <p className="mb-4 text-gray-600">Password requirements:</p>
        <ul className="space-y-2">
          <li className={`flex items-center ${min_length ? "text-green-600" : "text-red-600"}`}>
            <span className="mr-2">{min_length ? "✔" : "✘"}</span> At least 8 characters
          </li>
          <li className={`flex items-center ${has_lower_case ? "text-green-600" : "text-red-600"}`}>
            <span className="mr-2">{has_lower_case ? "✔" : "✘"}</span> At least one lowercase letter
          </li>
          <li className={`flex items-center ${has_upper_case ? "text-green-600" : "text-red-600"}`}>
            <span className="mr-2">{has_upper_case ? "✔" : "✘"}</span> At least one uppercase letter
          </li>
          <li className={`flex items-center ${has_number ? "text-green-600" : "text-red-600"}`}>
            <span className="mr-2">{has_number ? "✔" : "✘"}</span> At least one number
          </li>
          <li className={`flex items-center ${has_special_character ? "text-green-600" : "text-red-600"}`}>
            <span className="mr-2">{has_special_character ? "✔" : "✘"}</span> At least one special character
          </li>
          <li className={`flex items-center ${is_verified ? "text-green-600" : "text-red-600"}`}>
            <span className="mr-2">{is_verified ? "✔" : "✘"}</span> New password matches Verify password
          </li>
        </ul>

        <div className="mt-6 flex space-x-4">
          <button
            type="button"
            className="w-full max-w-xs h-10 p-2 bg-blue-800 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-300"
            onClick={cancelPasswordReset}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full max-w-xs h-10 p-2 bg-blue-800 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-300"
          >
            Reset Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
