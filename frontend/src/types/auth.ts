export interface User {
  id: string;
  name: string;
  email?: string;
  isAnonymous: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAnonymous: boolean;
  login: (email: string) => void;
  loginAsAnonymous: () => void;
  logout: () => void;
}