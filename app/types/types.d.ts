export type NavbarProps = {
  user: {
    name: string | null;
    email: string | null;
    image?: string | null;
  } | null;
  onLogout?: () => void;
};

export type propUser = NavbarProps["user"];
