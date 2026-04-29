import { useCallback, useEffect, useState } from "react";

import { getPageByPath, type RegisteredPage } from "@/app/routing/page-registry";

const getCurrentPage = () => getPageByPath(window.location.pathname);

export function useCurrentPage() {
  const [currentPage, setCurrentPage] = useState<RegisteredPage>(() => getCurrentPage());

  useEffect(() => {
    const syncCurrentPage = () => {
      setCurrentPage(getCurrentPage());
    };

    window.addEventListener("popstate", syncCurrentPage);

    return () => {
      window.removeEventListener("popstate", syncCurrentPage);
    };
  }, []);

  const navigate = useCallback((page: RegisteredPage) => {
    if (window.location.pathname !== page.path) {
      window.history.pushState(null, "", page.path);
    }

    setCurrentPage(page);
  }, []);

  return { currentPage, navigate };
}
