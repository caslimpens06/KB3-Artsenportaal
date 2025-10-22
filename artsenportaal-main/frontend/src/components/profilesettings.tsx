import React from "react";

interface UserProfileProps {
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    jobtitle: string;
    specialist: string;
    location: string;
  };
}

const ProfileSetting: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="bg-blue-200 rounded-xl h-4/5 p-4 w-full">
      <h2 className="w-7/10 h-1/20 font-bold text-indigo-800 pt-5 pl-2 ml-2 border-b-4 border-indigo-800">
        Profiel
      </h2>
      <div className="text-indigo-800">
        <div className="border-2 border-indigo-800 rounded-lg p-4 m-4 bg-blue-300 flex justify-between shadow-md">
          <strong>First Name:</strong> {user.firstName}
        </div>
        <div className="border-2 border-indigo-800 rounded-lg p-4 m-4 bg-blue-300 flex justify-between shadow-md">
          <strong>Last Name:</strong> {user.lastName}
        </div>
        <div className="border-2 border-indigo-800 rounded-lg p-4 m-4 bg-blue-300 flex justify-between shadow-md">
          <strong>Cellphone:</strong> {user.phone}
        </div>
        <div className="border-2 border-indigo-800 rounded-lg p-4 m-4 bg-blue-300 flex justify-between shadow-md">
          <strong>Email:</strong> {user.email}
        </div>
        <div className="border-2 border-indigo-800 rounded-lg p-4 m-4 bg-blue-300 flex justify-between shadow-md">
          <strong>Job Title:</strong> {user.jobtitle}
        </div>
        <div className="border-2 border-indigo-800 rounded-lg p-4 m-4 bg-blue-300 flex justify-between shadow-md">
          <strong>Specialist:</strong> {user.specialist}
        </div>
        <div className="border-2 border-indigo-800 rounded-lg p-4 m-4 bg-blue-300 flex justify-between shadow-md">
          <strong>Location:</strong> {user.location}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetting;
