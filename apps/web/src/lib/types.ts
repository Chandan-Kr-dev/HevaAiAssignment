export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string;
};

// Shape of GET /auth/me. Mirrors the API's CurrentUserData; kept in sync
// by hand since the frontend never validates auth payloads itself.
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};
