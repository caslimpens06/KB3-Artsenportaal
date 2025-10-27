import React, { useEffect, useState } from 'react';

const API_TOKEN = 'bfb52bb71af40caab8fd332a857f9ec19455ba436c918b93e7673f9f760a3306e1179a572bd26e4e3758f4ba0231f59acbefba796695fda0da675e04a0aaf241c206faad399f4c6bbe947b6a97eb5601de4654e21bc509e798393ae24ec0ab5e2587d9fc3694c515e2cab02c69dc929cf15374b5dc78c49386aafa9c4f13780d';

export interface Patient {
	id: number;
	name: string;
	patientId?: string;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	lab_results: Array<{
		id: number;
		documentId: string;
		resultName: string;
		value: string | null;
		unit: string;
		labResultId: string;
		createdAt: string;
		updatedAt: string;
		publishedAt: string;
		measurements?: Array<{
			id: number;
			measurementId: string;
			value: string;
			dateTime: string;
		}>;
	}>;
}

export interface PatientListProps {
	onPatientClick: (id: number) => void;
	patients?: Patient[];
}

const PatientList = ({ onPatientClick }: PatientListProps): JSX.Element => {
	const [patients, setPatients] = useState<Patient[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPatients = async () => {
			try {
				// Updated API call to properly populate lab results and their measurements
				const response = await fetch('http://localhost:1337/api/patients?populate[lab_results][populate][measurements]=*', {
					headers: {
						'Authorization': `Bearer ${API_TOKEN}`,
						'Content-Type': 'application/json'
					}
				});
				if (!response.ok) {
					throw new Error('Failed to fetch patients');
				}
				const data = await response.json();
				console.log('Fetched patients data:', JSON.stringify(data, null, 2));
				if (!data || !data.data) {
					throw new Error('Invalid data structure received from API');
				}
				setPatients(data.data);
			} catch (err) {
				console.error('Error fetching patients:', err);
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchPatients();
	}, []);

	if (loading) {
		return <div className="p-4">Loading patients...</div>;
	}

	if (error) {
		return <div className="p-4 text-red-500">Error: {error}</div>;
	}

	if (!patients || patients.length === 0) {
		return <div className="p-4">No patients found. Please add some patients in Strapi.</div>;
	}

	return (
		<div className="p-4">
			<h2 className="text-2xl font-bold mb-4">Patient Data</h2>
			<div className="mb-4">
				<button
					onClick={() => window.location.reload()}
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				>
					🔄 Refresh Patients
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white border border-gray-300">
					<thead>
						<tr className="bg-gray-100">
							<th className="px-6 py-3 border-b text-left">Patient Name</th>
							<th className="px-6 py-3 border-b text-left">Patient ID</th>
							<th className="px-6 py-3 border-b text-left">Lab Results</th>
							<th className="px-6 py-3 border-b text-left">Measurements</th>
						</tr>
					</thead>
					<tbody>
						{patients.map((patient) => (
							<tr 
								key={patient.id}
								className="hover:bg-gray-50 cursor-pointer"
								onClick={() => onPatientClick(patient.id)}
							>
								<td className="px-6 py-4 border-b font-medium">
									{patient.name}
								</td>
								<td className="px-6 py-4 border-b text-sm text-gray-600">
									{patient.patientId || 'N/A'}
								</td>
								<td className="px-6 py-4 border-b">
									{patient.lab_results?.map(result => (
										<div key={result.id} className="mb-1">
											<span className="font-medium">{result.resultName}:</span>{' '}
											{result.value || 'N/A'} {result.unit}
										</div>
									))}
									{(!patient.lab_results || patient.lab_results.length === 0) && (
										<span className="text-gray-500 italic">No lab results</span>
									)}
								</td>
								<td className="px-6 py-4 border-b">
									{patient.lab_results?.map(result => 
										result.measurements?.map(measurement => (
											<div key={measurement.id} className="mb-1">
												<span className="font-medium">{result.resultName}:</span>{' '}
												{measurement.value}
												<br />
												<span className="text-sm text-gray-500">
													{new Date(measurement.dateTime).toLocaleString()}
												</span>
											</div>
										))
									)}
									{(!patient.lab_results?.some(result => result.measurements && result.measurements.length > 0)) && (
										<span className="text-gray-500 italic">No measurements</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default PatientList;
