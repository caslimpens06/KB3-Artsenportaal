import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordPopup from "./forgotpasswordpopup";
import { login } from "../services/auth";

interface Props {
  setHideNavbar: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoginPage: React.FC<Props> = ({ setHideNavbar }) => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setHideNavbar(true);
    return () => {
      setHideNavbar(false);
    };
  }, [setHideNavbar]);

  const openPopup = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      console.log('Attempting to log in with:', email);
      const response = await login(email, password);
      console.log('Login successful, full response:', response);
      console.log('User object:', response.user);
      
      // Check username for role determination
      const username = response.user?.username?.toLowerCase();
      console.log('Username:', username);
      
      if (username === 'doctor') {
        console.log('Detected doctor role by username, redirecting to dashboard');
        navigate('/dashboard');
      } else if (username === 'researcher') {
        console.log('Detected researcher role by username, redirecting to research dashboard');
        navigate('/onderzoek-dashboard');
      } else {
        console.log('No matching role found for username:', username);
        console.log('Defaulting to dashboard');
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 
                         err.response?.data?.message ||
                         "Inloggen mislukt. Controleer uw gegevens.";
      setError(`${errorMessage} (${err.response?.status || 'Unknown error'})`);
    }
  };

  return (
    <div className="flex h-[75vh] mt-[10vh] mb-[10vh] mr-[15vh] ml-[15vh] relative">
      <div className="flex flex-col p-5 bg-[#c2d6ff] rounded-l-3xl w-[70%] relative">
        <div className="w-[50%] mb-8 pb-2 border-b-2 border-[#003366] text-[#003366] text-3xl">
          Inloggen
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input
              type="email"
              id="login-email"
              name="login-email"
              placeholder="E-mail"
              className="w-[95%] h-[4vh] p-3 bg-[#c2d6ff] text-black border-2 border-[#96a4f0] rounded-2xl pl-[55px] bg-no-repeat bg-[url('/public/Icons/User.svg')] focus:outline-none focus:border-[#003366] focus:transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Wachtwoord"
              className="w-[95%] h-[4vh] p-3 bg-[#c2d6ff] text-black border-2 border-[#96a4f0] rounded-2xl pl-[55px] bg-no-repeat bg-[url('/public/Icons/Key.svg')] focus:outline-none focus:border-[#003366] focus:transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div>
            <button
              id="login-button"
              type="submit"
              className="w-[30%] h-[6vh] p-3 bg-[#1b21d4] text-white rounded-lg text-lg cursor-pointer hover:bg-[#161bac]"
            >
              Log in
            </button>
            <button
              id="password-forgotten-button"
              type="button"
              onClick={openPopup}
              className="text-[#003366] text-sm ml-4"
            >
              Wachtwoord vergeten?
            </button>
          </div>
          {error && (
            <p className="text-red-600 mt-4">{error}</p>
          )}
        </form>

        <div className="absolute bottom-0 left-2 mb-2 w-[90%] text-[#003366]">
          <p>Mede mogelijk gemaakt door</p>
          <div className="flex items-center mt-2 border-t border-black pt-2">
            <img
              src="/images/umcUtrechtLogo.png"
              alt="UMC Utrecht Wilhelmina Kinderziekenhuis"
              className="mx-12 max-w-[25%]"
            />
            <img
              src="/images/JDBLogo.png"
              alt="JDB logo"
              className="mx-12 max-w-[25%]"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end items-end bg-[#c2d6ff] rounded-r-3xl">
        <img
          src="/images/loginImage.png"
          alt="Group of people in orange hoodies"
          className="max-w-full max-h-full h-screen"
        />
      </div>

      {showPopup && <ForgotPasswordPopup onClose={closePopup} />}
    </div>
  );
};

export default LoginPage;
