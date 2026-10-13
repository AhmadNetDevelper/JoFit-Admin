import { Link } from "react-router-dom";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { ListCard, PageHeader, SearchInput, StatusBadge } from "@/components/ui";
import { ORDER_STATUSES, ordersService, type Order, type OrderSortField } from "@/features/orders";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { CustomerLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { useStatusParam } from "../../use-status-param";

export function OrdersRoute() {
  const { t } = useTranslation();
  const { money, dateTime } = useFormatters();
  const { query, setSearch, setPage, setSort } = useListQuery<OrderSortField>({
    defaultSort: { field: "placedAt", direction: "desc" },
  });

  const [statuses, setStatuses] = useStatusParam(ORDER_STATUSES);

  const state = useAsyncData(
    () => ordersService.listOrders({ ...query, statuses }),
    [query, statuses?.join()],
  );

  const columns: readonly DataTableColumn<Order>[] = [
    {
      key: "reference",
      header: t("field.reference"),
      sortField: "reference",
      render: (order) => <Link to={`/orders/${order.id}`}>{order.reference}</Link>,
    },
    {
      key: "customer",
      header: t("field.customer"),
      render: (order) => <CustomerLink id={order.customer.id} name={order.customer.name} />,
    },
    {
      key: "kind",
      header: t("orders.contains"),
      render: (order) => {
        const kinds = new Set(order.lines.map((line) => line.kind));
        return [...kinds].map((kind) => t(kind === "shop" ? "orders.kindShop" : "orders.kindRental")).join(" + ");
      },
    },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: "placedAt",
      header: t("field.placedAt"),
      sortField: "placedAt",
      render: (order) => dateTime(order.placedAt),
    },
    {
      key: "total",
      header: t("field.total"),
      sortField: "grandTotal",
      align: "end",
      render: (order) => money(order.grandTotal),
    },
  ];

  return (
    <>
      <PageHeader title={t("orders.title")} description={t("orders.description")} />
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
                <StatusFilter statuses={ORDER_STATUSES} value={statuses} onChange={setStatuses} />
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("orders.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(order) => order.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<OrderSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </>
  );
}
