import React from "react";
import { Note } from "../abstracts/ImportsModels";

interface NoteProps {
	note: Note;
}

const NoteListItem: React.FC<NoteProps> = ({ note }) => {
	return (
		<div className="bg-blue-200 rounded-xl h-full p-4">
			<a
				href="/notelist"
				className="flex justify-start items-start gap-4 bg-white rounded-lg text-lg p-2 text-blue-800 font-semibold shadow-md hover:bg-gray-500 hover:bg-opacity-80 no-underline"
			>
				<div className="w-1/3">{note.Name}</div>
				<div className="w-1/3">
					{note.Specialist?.Firstname} {note.Specialist?.Lastname}
				</div>
				<div className="w-1/5">
					{note.Patient != null ? `${note.Patient.Firstname} ${note.Patient.Lastname}` : "-"}
				</div>
				<div className="w-1/5">{note.Session != null ? note.Session.Name : "-"}</div>
			</a>
		</div>
	);
};

export default NoteListItem;
