export type B3FileRecord = {
  id: string;
  companyId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  aiTag: string;
  createdAt: string;
};

export const B3_DEFAULT_LIMIT_GB = 50;
