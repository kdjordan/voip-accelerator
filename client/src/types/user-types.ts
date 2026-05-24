export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  lastLoggedIn: Date;
  createdAt: Date;
}

export interface UserState {
  info: UserInfo | null;
  sideNavOpen: boolean;
}
