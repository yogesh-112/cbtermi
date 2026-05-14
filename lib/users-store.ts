export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Shared in-memory store — seeded with one demo account
export const usersStore: User[] = [
  { id: "1", name: "Demo User", email: "demo@example.com", password: "password123" },
];
