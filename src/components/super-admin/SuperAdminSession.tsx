"use client";

import { createContext, useContext } from "react";

type SuperAdminSessionValue = {
  viewerEmail: string;
  platformName: string;
  canDeleteOwner: boolean;
};

const SuperAdminSessionContext = createContext<SuperAdminSessionValue>({
  viewerEmail: "",
  platformName: "BharatCloud by BharatTijori",
  canDeleteOwner: false,
});

export function SuperAdminSession({
  viewerEmail,
  platformName,
  canDeleteOwner,
  children,
}: SuperAdminSessionValue & { children: React.ReactNode }) {
  return (
    <SuperAdminSessionContext.Provider value={{ viewerEmail, platformName, canDeleteOwner }}>
      {children}
    </SuperAdminSessionContext.Provider>
  );
}

export function useSuperAdminSession() {
  return useContext(SuperAdminSessionContext);
}
