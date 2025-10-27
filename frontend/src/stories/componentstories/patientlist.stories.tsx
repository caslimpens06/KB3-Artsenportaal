// src/components/PatientList.stories.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import PatientList, { PatientListProps } from "../../components/patientlist";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof PatientList> = {
  title: "Components/PatientList",
  component: PatientList,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PatientList>;

export const Default: Story = {
  args: {
    onPatientClick: (id: number) => console.log(`Patient clicked: ${id}`),
    patients: [
      {
        id: 1,
        name: "John Doe",
        patientId: "patient-123",
        documentId: "doc123",
        createdAt: "2024-03-19T12:00:00.000Z",
        updatedAt: "2024-03-19T12:00:00.000Z",
        publishedAt: "2024-03-19T12:00:00.000Z",
        lab_results: [
          {
            id: 1,
            documentId: "lab123",
            resultName: "Blood Test",
            value: "120",
            unit: "mg/dL",
            labResultId: "lab-result-123",
            createdAt: "2024-03-19T12:00:00.000Z",
            updatedAt: "2024-03-19T12:00:00.000Z",
            publishedAt: "2024-03-19T12:00:00.000Z",
            measurements: [
              {
                id: 1,
                measurementId: "meas-123",
                value: "120",
                dateTime: "2024-03-19T12:00:00.000Z"
              }
            ]
          }
        ]
      }
    ]
  }
};

export const Empty: Story = {
  args: {
    onPatientClick: (id: number) => console.log(`Patient clicked: ${id}`),
    patients: []
  }
};

export const Loading: Story = {
  args: {
    onPatientClick: (id: number) => console.log(`Patient clicked: ${id}`),
  }
};
