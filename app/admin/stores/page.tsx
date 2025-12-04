import { StoresClient } from "./stores-client";

export default function StoresPage() {
  // Filter options will be fetched in client via server action
  return <StoresClient initialData={null} users={[]} />;
}
