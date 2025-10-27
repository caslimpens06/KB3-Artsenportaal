import React, { useEffect } from "react";

interface Props {
	setHideNavbar: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotFoundPage: React.FC<Props> = ({ setHideNavbar }) => {
	useEffect(() => {
		setHideNavbar(true);

		return () => {
			setHideNavbar(false);
		};
	}, [setHideNavbar]);

	return (
		<div className="text-center p-5">
			<img src="/images/404Error.jpg" alt="404 Error" className="max-w-full max-w-[1000px] mx-auto my-5" />
			<br />
			<a href="/dashboard">
				<input
					className="bg-blue-600 text-white py-2 px-5 border-none rounded-md text-lg cursor-pointer transition-colors duration-300 hover:bg-blue-500"
					type="button"
					value="Naar start"
				/>
			</a>
		</div>
	);
};

export default NotFoundPage;
