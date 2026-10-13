import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, TableThumbnail, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { Badge, Button, Label, ListCard, PageHeader, SearchInput, StatusBadge, Switch } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  catalogueService,
  hasLowStock,
  lowestVariantPrice,
  totalStock,
  type AdminProduct,
  type ProductSortField,
} from "@/features/catalogue";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { MediaImage, SortState } from "@/types";

/** The cover: the first image in the gallery (a video ahead of it is skipped, as the storefront does). */
const coverOf = (product: AdminProduct) =>
  product.media.find((entry): entry is MediaImage => entry.kind === "image");

export function ProductsRoute() {
  const { t } = useTranslation();
  const { text, money, number, date } = useFormatters();
  const notice = useNotice();
  const canWrite = usePermission("catalogue:write");
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const { query, flags, setSearch, setPage, setSort, setFlag } = useListQuery<ProductSortField>({
    defaultSort: { field: "title", direction: "asc" },
  });

  const lowStockOnly = flags.lowStock ?? false;
  const state = useAsyncData(
    () => catalogueService.listProducts({ ...query, lowStockOnly }),
    [query, lowStockOnly],
  );

  const columns: readonly DataTableColumn<AdminProduct>[] = [
    {
      key: "image",
      header: t("products.imageColumn"),
      render: (product) => <TableThumbnail image={coverOf(product)} />,
    },
    {
      key: "title",
      header: t("field.title"),
      sortField: "title",
      render: (product) => (
        <Link to={`/catalogue/products/${product.id}`}>{text(product.title)}</Link>
      ),
    },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (product) => <StatusBadge status={product.status} />,
    },
    {
      key: "stock",
      header: t("field.stock"),
      sortField: "stock",
      align: "end",
      render: (product) => (
        <span className="inline-flex items-center gap-2">
          <span data-figure>{number(totalStock(product))}</span>
          {hasLowStock(product) ? <Badge variant="destructive">{t("products.lowStock")}</Badge> : null}
        </span>
      ),
    },
    {
      key: "price",
      header: t("field.price"),
      sortField: "price",
      align: "end",
      render: (product) => {
        const price = lowestVariantPrice(product);
        return price ? money(price) : "—";
      },
    },
    {
      key: "updated",
      header: t("field.updated"),
      sortField: "updatedAt",
      render: (product) => date(product.audit.updatedAt),
    },
    {
      key: "actions",
      header: t("field.actions"),
      align: "end",
      render: (product) => (
        <RowActions
          label={text(product.title)}
          canWrite={canWrite}
          editTo={`/catalogue/products/${product.id}`}
          onDelete={() => setDeleting(product)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("products.title")}
        description={t("products.description")}
        actions={
          canWrite ? (
            <Button asChild>
              <Link to="/catalogue/products/new">
                <Plus /> {t("crud.addNoun", { noun: t("products.noun") })}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <AsyncBoundary
        state={state}
        pendingLabel={t("state.loading")}
      >
        {(page) => (
          <ListCard
            toolbar={
              <>
                <SearchInput
                  label={t("action.search")}
                  value={query.search ?? ""}
                  onChange={setSearch}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="products-low-stock"
                    checked={lowStockOnly}
                    onCheckedChange={(checked) => setFlag("lowStock", checked)}
                  />
                  <Label htmlFor="products-low-stock" className="font-normal">
                    {t("products.lowStockOnly")}
                  </Label>
                </div>
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("products.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(product) => product.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<ProductSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>

      {/* A product that has been ordered is refused here, with the count and a
          pointer to archiving — the dialog stays open to say so. */}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: text(deleting.title) }) : ""}
        onConfirm={async () => {
          if (!deleting) return;
          await catalogueService.deleteProduct(deleting.id);
          notice.success(t("crud.deleted", { name: text(deleting.title) }));
          state.refetch();
        }}
      />
    </>
  );
}
