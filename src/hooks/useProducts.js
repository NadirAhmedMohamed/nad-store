import { useCallback, useEffect, useRef, useState } from "react";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  startAt,
  endAt,
} from "firebase/firestore";

import { db } from "../firebase.config";

const PAGE_SIZE = 12;
const SEARCH_DELAY = 300;

export default function useProducts({
  category = "all",
  searchTerm = "",
} = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cursorsRef = useRef([null]);
  const requestIdRef = useRef(0);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Reset pagination when filters change.
  useEffect(() => {
    cursorsRef.current = [null];

    setPage(1);
    setProducts([]);
    setHasNextPage(false);
    setError("");
  }, [category, normalizedSearch]);

  // Fetch products.
  const fetchProducts = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");

    try {
      const constraints = [];

      // Category filter.
      if (category !== "all") {
        constraints.push(where("category", "==", category));
      }

      // Sorting.
      constraints.push(orderBy("titleLower", "asc"));

      // Search.
      if (normalizedSearch) {
        constraints.push(
          startAt(normalizedSearch),
          endAt(normalizedSearch + "\uf8ff"),
        );
      }

      // Pagination cursor.
      const cursor = cursorsRef.current[page - 1];

      if (cursor) {
        constraints.push(startAfter(cursor));
      }

      // Fetch one extra document.
      constraints.push(limit(PAGE_SIZE + 1));

      const productsQuery = query(collection(db, "products"), ...constraints);

      const snapshot = await getDocs(productsQuery);

      // Ignore outdated requests.
      if (requestId !== requestIdRef.current) {
        return;
      }

      const documents = snapshot.docs;

      // Current page products.
      const visibleDocuments = documents.slice(0, PAGE_SIZE);

      // Map Firestore documents to products.
      const uniqueProducts = Array.from(
        new Map(
          visibleDocuments.map((productDoc) => [
            productDoc.id,
            {
              id: productDoc.id,
              ...productDoc.data(),
            },
          ]),
        ).values(),
      );

      setProducts(uniqueProducts);

      // Check next page.
      const hasMore = documents.length > PAGE_SIZE;

      setHasNextPage(hasMore);

      // Save cursor for next page.
      if (hasMore && visibleDocuments.length > 0) {
        cursorsRef.current[page] =
          visibleDocuments[visibleDocuments.length - 1];
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Firestore products error:", err);

      setError(
        err.code === "failed-precondition"
          ? "This query needs a Firestore index. Check the console."
          : "Could not load products. Please try again.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [category, normalizedSearch, page]);

  // Fetch with debounce.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, SEARCH_DELAY);

    return () => {
      clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [fetchProducts]);

  // Next page.
  const nextPage = useCallback(() => {
    if (hasNextPage && !loading) {
      setPage((current) => current + 1);
    }
  }, [hasNextPage, loading]);

  // Previous page.
  const previousPage = useCallback(() => {
    if (page > 1 && !loading) {
      setPage((current) => current - 1);
    }
  }, [page, loading]);

  return {
    products,
    loading,
    error,
    page,
    hasNextPage,
    nextPage,
    previousPage,
  };
}
