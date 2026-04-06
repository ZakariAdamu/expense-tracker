"use client";

import {
	createContext,
	useContext,
	useState,
	type Dispatch,
	type PropsWithChildren,
	type SetStateAction,
} from "react";

export type UserRole = "Admin" | "Guest";

type UserRoleContextValue = {
	role: UserRole;
	setRole: Dispatch<SetStateAction<UserRole>>;
};

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

export function UserRoleProvider({ children }: PropsWithChildren) {
	const [role, setRole] = useState<UserRole>("Admin");

	return (
		<UserRoleContext.Provider value={{ role, setRole }}>
			{children}
		</UserRoleContext.Provider>
	);
}

export function useUserRole() {
	const context = useContext(UserRoleContext);

	if (!context) {
		throw new Error("useUserRole must be used within a UserRoleProvider");
	}

	return context;
}
