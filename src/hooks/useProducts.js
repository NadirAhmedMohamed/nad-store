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

  // Reset products and pagination when filters change.
  useEffect(() => {
    cursorsRef.current = [null];

    setPage(1);
    setProducts([]);
    setHasNextPage(false);
    setError("");

    // Immediately show loading state.
    setLoading(true);
  }, [category, normalizedSearch]);

  // Fetch products from Firestore.
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

      // Search filter.
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

      // Fetch one extra document to detect the next page.
      constraints.push(limit(PAGE_SIZE + 1));

      const productsQuery = query(collection(db, "products"), ...constraints);

      const snapshot = await getDocs(productsQuery);

      // Ignore outdated requests.
      if (requestId !== requestIdRef.current) {
        return;
      }

      const documents = snapshot.docs;

      // Get products for the current page.
      const visibleDocuments = documents.slice(0, PAGE_SIZE);

      // Remove duplicate document IDs.
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

      // Check if another page exists.
      const hasMore = documents.length > PAGE_SIZE;

      setHasNextPage(hasMore);

      // Save the cursor for the next page.
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

  // Fetch products with a short debounce.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, SEARCH_DELAY);

    return () => {
      clearTimeout(timer);

      // Invalidate any previous request.
      requestIdRef.current += 1;
    };
  }, [fetchProducts]);

  // Navigate to the next page.
  const nextPage = useCallback(() => {
    if (hasNextPage && !loading) {
      setPage((current) => current + 1);
    }
  }, [hasNextPage, loading]);

  // Navigate to the previous page.
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
