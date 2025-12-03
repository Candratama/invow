import { headers } from "next/headers";
import { getTransactions } from "@/app/actions/admin";
import { TransactionsClient } from "./transactions-client";

const PAGE_SIZE = 10;

interface TransactionsPageProps {
  searchParams: Promise<{
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  const status = params.status as
    | "all"
    | "pending"
    | "completed"
    | "failed"
    | undefined;
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const page = parseInt(params.page || "1", 10);

  // Check if this is a client-side navigation
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  const isClientNavigation =
    referer.includes(host) && referer.includes("/admin");

  let initialData = null;

  // Skip server fetch for client navigation - React Query will use cached data
  if (!isClientNavigation) {
    const result = await getTransactions({
      status: status === "all" ? undefined : status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      pageSize: PAGE_SIZE,
    });

    initialData = result.data || null;
  }

  return (
    <TransactionsClient
      initialData={initialData}
      filters={{
        status: status || "all",
        dateFrom,
        dateTo,
        page,
      }}
    />
  );
}
