export interface User {
  id: string;
  name: string;
  email?: string;
  isAnonymous: boolean;
  isAdmin?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAnonymous: boolean;
  login: (user: User) => void;
  loginAsAnonymous: () => void;
  logout: () => void;
}
