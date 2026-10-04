import { BackgroundActivityProfile } from '../types';

export const BACKGROUND_PROFILES: BackgroundActivityProfile[] = [
  {
    id: 'profile-developer',
    name: 'Developer Workstation',
    description: 'Simulates a developer workstation with HTTP, SSH, and endpoint activity',
    httpActivity: true,
    sshActivity: true,
    databaseActivity: false,
    endpointActivity: true,
    intensity: 'MEDIUM'
  },
  {
    id: 'profile-server',
    name: 'Server',
    description: 'Simulates a production-like server with SSH and service activity',
    httpActivity: true,
    sshActivity: true,
    databaseActivity: false,
    endpointActivity: true,
    intensity: 'LOW'
  },
  {
    id: 'profile-database-server',
    name: 'Database Server',
    description: 'Simulates a database server with query and authentication activity',
    httpActivity: false,
    sshActivity: true,
    databaseActivity: true,
    endpointActivity: true,
    intensity: 'MEDIUM'
  }
];

export function getBackgroundProfileById(id: string): BackgroundActivityProfile | undefined {
  return BACKGROUND_PROFILES.find(p => p.id === id);
}

export function listBackgroundProfiles(): BackgroundActivityProfile[] {
  return [...BACKGROUND_PROFILES];
}
