// hooks/useRecentlyViewed.js
"use client";
import { useEffect, useState } from "react";
import { getRecentlyViewed } from "@/utils/recentlyViewed";

const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  return { recentlyViewed, setRecentlyViewed };
};

export default useRecentlyViewed;
