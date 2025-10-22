import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import NoteListItem from "../../components/notelistitem";
import { Note } from "../../abstracts/ImportsModels";

export default {
  title: "Components/NoteListItem",
  component: NoteListItem,
  tags: ["autodocs"],
} as Meta;

const Template: StoryFn<{ note: Note }> = (args) => <NoteListItem {...args} />;

// Voorbeeld van een verhaal met een volledige note
export const DefaultNote = Template.bind({});
DefaultNote.args = {
  note: {
    Name: "Voorbeeldnotitie",
    Specialist: {
      Firstname: "Jan",
      Lastname: "Jansen",
    },
    Patient: {
      Firstname: "Piet",
      Lastname: "Pietersen",
    },
    Session: {
      Name: "Sessie 1",
    },
  } as Note,
};

// Voorbeeld van een verhaal zonder patient en sessie
export const NoteWithoutPatientAndSession = Template.bind({});
NoteWithoutPatientAndSession.args = {
  note: {
    Name: "Notitie zonder patient",
    Specialist: {
      Firstname: "Sara",
      Lastname: "Smit",
    },
    Patient: null,
    Session: null,
  } as Note,
};
