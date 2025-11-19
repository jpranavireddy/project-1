export interface Repository {
  id: string;
  name: string;
  url: string;
  owner: string;
  description: string;
  primaryLanguage: string;
  isPrivate: boolean;
  createdAt: Date;
  lastSyncedAt: Date;
}
