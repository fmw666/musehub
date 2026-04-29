export type FavoriteTargetType = "content" | "repository";

export type FavoriteItem = {
  id: string;
  targetId: string;
  targetType: FavoriteTargetType;
  collectionId?: string;
  createdAt: string;
};
