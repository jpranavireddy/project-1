export type DeveloperRole = 'developer' | 'senior_developer' | 'team_lead' | 'manager';

export interface Developer {
  id: string;
  githubUsername: string;
  email: string;
  name: string;
  role: DeveloperRole;
  teamId: string;
  joinDate: Date;
  profileData: {
    avatar: string;
    bio: string;
    location: string;
  };
}
