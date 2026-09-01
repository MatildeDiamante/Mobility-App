export type UserRole = 'student' | 'professor' | 'office';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}
