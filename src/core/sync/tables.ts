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
    transactions: {
        name: 'transactions',
        columns: ['id', 'card_id', 'kind', 'amount_cents', 'description', 'category',
            'occurred_at', 'loan_id', 'loan_payment_id',
            'created_at', 'updated_at', 'deleted_at'],
    },
    products: {
        name: 'products',
        columns: ['id', 'barcode', 'name', 'price_cents', 'price_updated_at',
            'created_at', 'updated_at', 'deleted_at'],
    },
    shopping_trips: {
        name: 'shopping_trips',
        columns: ['id', 'store', 'budget_cents', 'status', 'transaction_id',
            'created_at', 'closed_at', 'updated_at', 'deleted_at'],
    },
    shopping_items: {
        name: 'shopping_items',
        columns: ['id', 'trip_id', 'product_id', 'name', 'unit_price_cents', 'quantity',
            'created_at', 'updated_at', 'deleted_at'],
    },

};


export const ENABLED_TABLES = [
  'cards', 'people', 'loans', 'loan_payments', 'transactions',
  'products', 'shopping_trips', 'shopping_items',
];
export const WIPE_ORDER = ['shopping_items', 'shopping_trips', 'products', 'loan_payments',
    'loans', 'transactions', 'people', 'cards'];