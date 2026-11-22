export type SyncTable = { name: string; columns: string[] };

export const ALL_TABLES: Record<string, SyncTable> = {
  cards: {
    name: 'cards',
    columns: ['id','name','bank','last4','initial_balance_cents',
              'created_at','updated_at','deleted_at'],
  },
  // las demás se agregan una por una (necesito ver sus repositorios)
};


export const ENABLED_TABLES = ['cards'];
export const WIPE_ORDER = ['shopping_items','shopping_trips','products','loan_payments',
  'loans','transactions','people','cards'];