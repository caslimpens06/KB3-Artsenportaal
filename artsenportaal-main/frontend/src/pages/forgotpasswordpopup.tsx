import React, { useState } from "react";
import { apiUrl } from "../abstracts/Constances";

interface ForgotPasswordPopupProps {
  onClose: () => void;
}

const ForgotPasswordPopup: React.FC<ForgotPasswordPopupProps> = ({ onClose }) => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(apiUrl + "user/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    if (response.ok) alert("Email verstuurd! Check u inbox om verder te gaan.");
    else alert("Kon email niet versturen naar " + email);

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1e4f] text-white p-10 rounded-lg w-[30%] h-[43vh] border-2 border-[#ff6600]"
        onClick={(e) => e.stopPropagation()}
      >
        <form id="reset-password-form" onSubmit={handleSubmit}>
          <h1 className="pb-2 border-b-2 border-[#ff6600] text-3xl">
            wachtwoord vergeten
          </h1>
          <p className="mb-3 leading-relaxed">
            Indien je je wachtwoord bent vergeten, kun je deze wijzigen via mail. Vul onderstaande gegevens in en
            volg vervolgens de instructies in de e-mail om je wachtwoord eenvoudig te wijzigen.
          </p>
          <label htmlFor="email" className="block text-xl font-bold mb-2">
            Vul hier je e-mailadres in
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="e-mail"
            className="w-full mb-5 p-3 bg-[#232969] text-white border-2 border-[#013e7a] rounded-2xl focus:border-[#96a4f0] focus:outline-none transition ease-in-out"
          />
          <div className="flex w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-[#4c4f9e] text-white rounded-lg mr-4"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-[#ff6600] text-white rounded-lg"
            >
              Verstuur
            </button>
          </div>
        </form>
        <p className="text-xs mt-5">
          Bron:{" "}
          <a
            href="https://www.hetwkz-kind.nl/hoe-zit-dat/het-ziekenhuis/kinderraad/"
            className="text-[#ff6600] hover:underline"
          >
            https://www.hetwkz-kind.nl/hoe-zit-dat/het-ziekenhuis/kinderraad/
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPopup;
