-- Enable real-time replication for invoices table
-- This allows real-time subscriptions to listen for changes to invoices
-- Part of Phase 3: Real-time Subscriptions architecture

ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_items;
