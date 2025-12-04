import { InvoicesClient } from "./invoices-client";

export default function InvoicesPage() {
  // Filter options will be fetched in client via server action
  return <InvoicesClient initialData={null} users={[]} stores={[]} />;
}
