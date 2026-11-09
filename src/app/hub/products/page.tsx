"use client";

import { useEffect, useState } from "react";

import { ProductList } from "@/components/product/PartnerHome";
import { Shell } from "@/components/product/Shell";

type ProductCard = {
  code: string;
  name: string;
  ids: number;
  gb: number;
  priceLabel: string;
  owned: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [planName, setPlanName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetch("/api/product/partner")
        .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
        .then(({ ok, body }) => {
          if (!ok) {
            setError(body.error || "Products nahi khule.");
            return;
          }
          setPlanName(body.plan?.name || "");
          setProducts(body.products || []);
        });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Shell title="Products" role="Partner">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {planName ? <p className="mb-4 text-sm">Aapka plan: {planName}</p> : null}
      <ProductList products={products} />
    </Shell>
  );
}
