export const SUPER_ADMIN_OWNER = (
  process.env.NEXT_PUBLIC_SUPER_ADMIN_OWNER || "super@bharatcloud.store"
)
  .trim()
  .toLowerCase();

export const PLATFORM_NAME =
  process.env.NEXT_PUBLIC_PLATFORM_NAME || "BharatCloud by BharatTijori";
