export type AppUser = {
  id: number;
  email: string;
  name: string;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: AppUser;
};
