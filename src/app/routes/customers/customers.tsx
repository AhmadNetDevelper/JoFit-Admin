import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { ListCard, NativeSelect, NativeSelectOption, PageHeader, SearchInput } from "@/components/ui";
import { customersService, type Customer, type CustomerSortField } from "@/features/customers";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { CustomerLink } from "../../components/record-parts";

export function CustomersRoute() {
  const { t } = useTranslation();
  const { money, number, date } = useFormatters();
  const { query, flags, setSearch, setPage, setSort, setFlag } = useListQuery<CustomerSortField>({
    defaultSort: { field: "lifetimeValue", direction: "desc" },
  });

  const optedIn = flags.optedIn ?? false;
  const state = useAsyncData(
    () => customersService.listCustomers({ ...query, marketingOptInOnly: optedIn }),
    [query, optedIn],
  );

  const columns: readonly DataTableColumn<Customer>[] = [
    // Customer names are real-world data and are never translated.
    {
      key: "name",
      header: t("field.name"),
      sortField: "name",
      render: (row) => <CustomerLink id={row.id} name={row.name} />,
    },
    { key: "email", header: t("field.email"), render: (row) => <span dir="ltr">{row.email}</span> },
    { key: "city", header: t("field.city"), render: (row) => row.city },
    {
      key: "activity",
      header: t("customers.activity"),
      render: (row) => (
        <span className="text-muted-foreground">
          {t("customers.activitySummary", {
            hires: number(row.activity.rentalBookings),
            sessions: number(row.activity.coachBookings),
            courses: number(row.activity.enrolments),
          })}
        </span>
      ),
    },
    {
      key: "orders",
      header: t("field.orders"),
      sortField: "orderCount",
      align: "end",
      render: (row) => number(row.orderCount),
    },
    {
      key: "ltv",
      header: t("field.lifetimeValue"),
      sortField: "lifetimeValue",
      align: "end",
      render: (row) => money(row.lifetimeValue),
    },
    {
      key: "last",
      header: t("field.lastOrder"),
      sortField: "lastOrderAt",
      render: (row) => (row.lastOrderAt ? date(row.lastOrderAt) : "—"),
    },
  ];

  return (
    <>
      <PageHeader title={t("customers.title")} description={t("customers.description")} />
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
                <NativeSelect
                  aria-label={t("customers.marketingFilter")}
                  wrapperClassName="w-56"
                  value={optedIn ? "optedIn" : "all"}
                  onChange={(event) => setFlag("optedIn", event.target.value === "optedIn")}
                >
                  <NativeSelectOption value="all">{t("customers.filterAll")}</NativeSelectOption>
                  <NativeSelectOption value="optedIn">{t("customers.optedInOnly")}</NativeSelectOption>
                </NativeSelect>
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("customers.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<CustomerSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </>
  );
}
