import type { TransactionKind } from '@/core/db/kinds';
import { colors } from '@/core/theme/colors';

export type LoanDirection = 'lent' | 'borrowed';

type DirectionConfig = {
  // Movimiento que se crea en la tarjeta
  createKind: TransactionKind;
  payKind: TransactionKind;
  createDescription: (name: string) => string;
  payDescription: (name: string) => string;
  // Aspecto
  arrow: 'arrow-down' | 'arrow-up';
  accent: string;
  tint: string;
  watermark: string;
  // Lista
  listTitle: string;
  summaryLabel: string;
  emptyPending: string;
  emptyPaid: string;
  emptyCta: string;
  settledShort: string;
  countLabel: (n: number) => string;
  // Detalle
  detailLabel: string;
  settledLabel: string;
  pillOwes: string;
  progress: (paid: string, total: string) => string;
  moreButton: string;
  loansSection: string;
  // Formulario de nuevo préstamo o deuda
  newTitle: string;
  personQuestion: string;
  amountLine: (name: string) => string;
  cardQuestion: string;
  dueQuestion: string;
  notePlaceholder: string;
  // Formulario de pago
  payTitle: (name: string) => string;
  payCardQuestion: string;
  owedLabel: string;
  overMsg: (name: string, amount: string) => string;
  noDebt: (name: string) => string;
  applyOne: (date: string) => string;
  applyMany: (n: number) => string;
};

export const DIRECTION: Record<LoanDirection, DirectionConfig> = {
  // Le prestaste a alguien: te deben
  lent: {
    createKind: 'loan_given', // la tarjeta baja
    payKind: 'loan_collected', // la tarjeta sube
    createDescription: (name) => `Préstamo a ${name}`,
    payDescription: (name) => `Pago de ${name}`,
    arrow: 'arrow-down',
    accent: colors.primary,
    tint: 'rgba(149,255,119,0.12)',
    watermark: 'rgba(149,255,119,0.07)',
    listTitle: 'Préstamos',
    summaryLabel: 'Te deben',
    emptyPending: 'Aún no le has prestado a nadie.',
    emptyPaid: 'Nadie ha terminado de pagarte todavía.',
    emptyCta: 'Prestar dinero',
    settledShort: 'todo cobrado',
    countLabel: (n) => `${n} ${n === 1 ? 'préstamo' : 'préstamos'}`,
    detailLabel: 'Te debe',
    settledLabel: 'Todo cobrado',
    pillOwes: 'Debe',
    progress: (paid, total) => `Cobrado ${paid} de ${total}`,
    moreButton: 'Prestar más',
    loansSection: 'Préstamos',
    newTitle: 'Nuevo préstamo',
    personQuestion: '¿A quién le prestas?',
    amountLine: (name) => `Prestas a ${name}`,
    cardQuestion: '¿De dónde sale?',
    dueQuestion: '¿Cuándo te lo devuelve?',
    notePlaceholder: 'Ej. para el taxi',
    payTitle: (name) => `${name} te pagó`,
    payCardQuestion: '¿Dónde lo recibiste?',
    owedLabel: 'Debía',
    overMsg: (name, amount) => `${name} solo debe ${amount}.`,
    noDebt: (name) => `${name} no te debe nada por ahora.`,
    applyOne: (date) => `Se aplica al préstamo del ${date}`,
    applyMany: (n) => `Se reparte entre ${n} préstamos, del más antiguo al más nuevo`,
  },
  // Alguien te prestó a ti: debes
  borrowed: {
    createKind: 'loan_received', // la tarjeta sube
    payKind: 'debt_paid', // la tarjeta baja
    createDescription: (name) => `Préstamo de ${name}`,
    payDescription: (name) => `Pago a ${name}`,
    arrow: 'arrow-up',
    accent: colors.danger,
    tint: 'rgba(255,107,107,0.14)',
    watermark: 'rgba(255,107,107,0.07)',
    listTitle: 'Deudas',
    summaryLabel: 'Debes',
    emptyPending: 'No le debes a nadie.',
    emptyPaid: 'Aún no has terminado de pagarle a nadie.',
    emptyCta: 'Registrar una deuda',
    settledShort: 'todo pagado',
    countLabel: (n) => `${n} ${n === 1 ? 'deuda' : 'deudas'}`,
    detailLabel: 'Le debes',
    settledLabel: 'Todo pagado',
    pillOwes: 'Debes',
    progress: (paid, total) => `Pagado ${paid} de ${total}`,
    moreButton: 'Pedir más',
    loansSection: 'Deudas',
    newTitle: 'Nueva deuda',
    personQuestion: '¿Quién te prestó?',
    amountLine: (name) => `Te prestó ${name}`,
    cardQuestion: '¿En qué tarjeta lo recibiste?',
    dueQuestion: '¿Cuándo debes devolverlo?',
    notePlaceholder: 'Ej. para el alquiler',
    payTitle: (name) => `Le pagas a ${name}`,
    payCardQuestion: '¿De dónde pagas?',
    owedLabel: 'Debías',
    overMsg: (name, amount) => `Solo le debes ${amount} a ${name}.`,
    noDebt: (name) => `No le debes nada a ${name}.`,
    applyOne: (date) => `Se aplica a la deuda del ${date}`,
    applyMany: (n) => `Se reparte entre ${n} deudas, de la más antigua a la más nueva`,
  },
};