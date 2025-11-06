-- Enable RLS on tables that don't have it
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Add basic policies for these tables (allowing all operations for now since they're part of existing functionality)
CREATE POLICY "Allow all operations on chats"
  ON public.chats
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_messages"
  ON public.chat_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on n8n_chat_histories"
  ON public.n8n_chat_histories
  FOR ALL
  USING (true)
  WITH CHECK (true);