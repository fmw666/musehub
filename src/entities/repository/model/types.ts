export type RepositoryProvider = "github" | "gitlab" | "bitbucket" | "local" | "other";

export type RepositoryRecord = {
  id: string;
  name: string;
  provider: RepositoryProvider;
  url: string;
  description?: string;
  linkedContentIds: readonly string[];
  lastSyncedAt?: string;
};
