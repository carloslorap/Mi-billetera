export type SyncTable = { name: string; columns: string[] };

export const ALL_TABLES: Record<string, SyncTable> = {
    cards: {
        name: 'cards',
        columns: ['id', 'name', 'bank', 'last4', 'initial_balance_cents',
            'created_at', 'updated_at', 'deleted_at'],
    },
    people: {
        name: 'people',
        columns: ['id', 'name', 'aliases', 'avatar',
            'created_at', 'updated_at', 'deleted_at'],
    },
    loans: {
        name: 'loans',
        columns: ['id', 'direction', 'person_id', 'amount_cents', 'expected_return_date',
            'notes', 'created_at', 'updated_at', 'deleted_at'],
    },
    loan_payments: {
        name: 'loan_payments',
        columns: ['id', 'loan_id', 'amount_cents', 'paid_at',
            'created_at', 'updated_at', 'deleted_at'],
    },
    // las demás se agregan una por una (necesito ver sus repositorios)
};


export const ENABLED_TABLES = ['cards', 'people','loans','loan_payments'];
export const WIPE_ORDER = ['shopping_items', 'shopping_trips', 'products', 'loan_payments',
    'loans', 'transactions', 'people', 'cards'];