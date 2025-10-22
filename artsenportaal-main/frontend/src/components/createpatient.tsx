import React, { useState, useRef } from "react";
import { closePatientForm } from "../scripts/functions";

const CreatePatient: React.FC = () => {
	const [id, setId] = useState<number>(0);
	const [firstname, setFirstname] = useState<string>("");
	const [lastname, setLastname] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [age, setAge] = useState<number>(0);
	const [phonenumber, setPhonenumber] = useState<string>("");
	const [sex, setSex] = useState<boolean>(false);
	const [firstnameContact, setFirstnameContact] = useState<string>("");
	const [lastnameContact, setLastnameContact] = useState<string>("");
	const [emailContact, setEmailContact] = useState<string>("");
	const [phonenumberContact, setPhonenumberContact] = useState<string>("");

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		const newPatient = {
			Id: id,
			Firstname: firstname,
			Lastname: lastname,
			Email: email,
			Age: age,
			Phonenumber: phonenumber,
			Sex: sex,
			FirstnameContact: firstnameContact,
			LastnameContact: lastnameContact,
			EmailContact: emailContact,
			PhonenumberContact: phonenumberContact,
			Specialists: [],
			Notes: [],
			Medications: [],
			Appointments: [],
		};

		console.log("Patiënt aangemaakt:", newPatient);
		setId(0);
		setFirstname("");
		setLastname("");
		setEmail("");
		setAge(0);
		setPhonenumber("");
		setSex(false);
		setFirstnameContact("");
		setLastnameContact("");
		setEmailContact("");
		setPhonenumberContact("");
	};

	const firstnameRef = useRef(null);
	const lastnameRef = useRef(null);

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
			<div className="p-6 max-w-xl w-full bg-blue-100 text-blue-900 border border-gray-300 rounded-lg shadow-lg">
				<form onSubmit={handleSubmit} className="space-y-4">
					<span
						className="text-lg font-bold cursor-pointer text-red-600 float-right"
						onClick={closePatientForm}
					>
						X
					</span>
					<label className="flex flex-col">
						<span>Voornaam:</span>
						<input
							ref={firstnameRef}
							className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
							type="text"
							value={firstname}
							onChange={(e) => setFirstname(e.target.value)}
						/>
					</label>
					<label className="flex flex-col">
						<span>Achternaam:</span>
						<input
							ref={lastnameRef}
							className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
							type="text"
							value={lastname}
							onChange={(e) => setLastname(e.target.value)}
						/>
					</label>
					<label className="flex flex-col">
						<span>Email:</span>
						<input
							className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</label>
					<label className="flex flex-col">
						<span>Leeftijd:</span>
						<input
							className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
							type="number"
							value={age}
							onChange={(e) => setAge(+e.target.value)}
						/>
					</label>
					<label className="flex flex-col">
						<span>Telefoonnummer:</span>
						<input
							className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
							type="tel"
							value={phonenumber}
							onChange={(e) => setPhonenumber(e.target.value)}
						/>
					</label>
					<div className="flex flex-col">
						<span>Geslacht:</span>
						<div className="flex gap-4">
							<label className="flex items-center">
								<input
									type="radio"
									name="sex"
									value="male"
									checked={!sex}
									onChange={() => setSex(false)}
									className="mr-2"
								/>
								Man
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									name="sex"
									value="female"
									checked={sex}
									onChange={() => setSex(true)}
									className="mr-2"
								/>
								Vrouw
							</label>
						</div>
					</div>
					<label className="flex flex-col">
						<span>Voornaam Contactpersoon:</span>
						<input
							className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
							type="text"
							value={firstnameContact}
							onChange={(e) => setFirstnameContact(e.target.value)}
						/>
					</label>
					{/* ... more fields go here */}
					<button
						type="submit"
						className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
					>
						Maak patiënt
					</button>
				</form>
			</div>
		</div>
	);
};

export default CreatePatient;
