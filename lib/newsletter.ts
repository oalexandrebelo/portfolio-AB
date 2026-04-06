/**
 * Newsletter Subscription System
 * Storage: Supabase table `subscribers`
 * Flow: Subscribe -> Confirm email (double opt-in) -> Receive new posts
 * Trigger: n8n workflow on new blog post
 *
 * Status: Structure ready, requires Supabase connection to activate
 */

interface Subscriber {
  email: string;
  confirmed: boolean;
  created_at: string;
}

// Supabase schema for reference (apply via migration when ready):
// CREATE TABLE subscribers (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   email TEXT UNIQUE NOT NULL,
//   confirmed BOOLEAN DEFAULT false,
//   confirm_token UUID DEFAULT gen_random_uuid(),
//   created_at TIMESTAMPTZ DEFAULT now(),
//   unsubscribed_at TIMESTAMPTZ
// );

export async function subscribe(
  email: string
): Promise<{ success: boolean; message: string }> {
  // TODO: Connect to Supabase when ready
  // const { data, error } = await supabase
  //   .from('subscribers')
  //   .insert({ email })
  //   .select()
  //   .single();

  console.log(`[Newsletter] Subscription request: ${email}`);

  return {
    success: true,
    message: "Obrigado! Confirme seu email para receber novos artigos.",
  };
}

export async function confirmSubscription(token: string): Promise<boolean> {
  // TODO: Connect to Supabase when ready
  // const { data, error } = await supabase
  //   .from('subscribers')
  //   .update({ confirmed: true })
  //   .eq('confirm_token', token);

  return true;
}

export async function unsubscribe(email: string): Promise<boolean> {
  // TODO: Connect to Supabase when ready
  return true;
}
