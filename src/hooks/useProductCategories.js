import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";

export default function useProductCategories() {
  const [categories, setCategories] = useState(["all"]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setCategoriesError(null);

        const snapshot = await getDocs(collection(db, "products"));

        const uniqueCategories = new Map();

        snapshot.docs.forEach((productDoc) => {
          const category = productDoc.data().category;

          if (typeof category !== "string" || !category.trim()) {
            return;
          }

          const value = category.trim();
          const key = value.toLowerCase();

          if (!uniqueCategories.has(key)) {
            uniqueCategories.set(key, value);
          }
        });

        const result = [
          "all",
          ...Array.from(uniqueCategories.values()).sort((a, b) =>
            a.localeCompare(b),
          ),
        ];

        if (active) {
          setCategories(result);
        }
      } catch (error) {
        console.error("Categories loading error:", error);

        if (active) {
          setCategoriesError("Unable to load product categories.");
        }
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  return {
    categories,
    loadingCategories,
    categoriesError,
  };
}

export async function inspectProductCategories() {
  const snapshot = await getDocs(collection(db, "products"));

  const categoryStats = new Map();
  const missingCategory = [];

  snapshot.docs.forEach((productDoc) => {
    const data = productDoc.data();
    const rawCategory = data.category;

    if (typeof rawCategory !== "string" || !rawCategory.trim()) {
      missingCategory.push({
        id: productDoc.id,
        title: data.title || "Unknown",
        category: rawCategory ?? "Missing",
      });
      return;
    }

    const normalized = rawCategory.trim().toLowerCase();

    if (!categoryStats.has(normalized)) {
      categoryStats.set(normalized, {
        normalized,
        variants: new Map(),
        total: 0,
      });
    }

    const group = categoryStats.get(normalized);

    group.total += 1;

    group.variants.set(rawCategory, (group.variants.get(rawCategory) || 0) + 1);
  });

  console.log("Total products:", snapshot.size);

  console.log("Category variations:");

  console.table(
    Array.from(categoryStats.values()).map((group) => ({
      normalized: group.normalized,
      totalProducts: group.total,
      rawNames: Array.from(group.variants.keys()).join(" | "),
      variations: group.variants.size,
    })),
  );

  console.log("Products without valid category:");

  console.table(missingCategory);

  return {
    totalProducts: snapshot.size,
    categoryStats,
    missingCategory,
  };
}

export async function inspectMissingTitleLower() {
  const snapshot = await getDocs(collection(db, "products"));

  const missing = [];

  snapshot.docs.forEach((productDoc) => {
    const data = productDoc.data();

    if (typeof data.titleLower !== "string" || !data.titleLower.trim()) {
      missing.push({
        id: productDoc.id,
        title: data.title || "Unknown",
        category: data.category || "Unknown",
        titleLower: data.titleLower ?? "Missing",
      });
    }
  });

  console.log("Total products:", snapshot.size);
  console.log("Missing titleLower:", missing.length);

  console.table(missing);

  return missing;
}
