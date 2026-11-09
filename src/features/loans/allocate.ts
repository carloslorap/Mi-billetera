export type OpenLoan = { id: string; remaining_cents: number };

export function allocateOldestFirst(openLoans: OpenLoan[], amountCents: number) {
  const allocations: { loanId: string; amountCents: number }[] = [];
  let left = amountCents;

  for (const loan of openLoans) {
    if (left <= 0) break;
    if (loan.remaining_cents <= 0) continue;
    const applied = Math.min(left, loan.remaining_cents);
    allocations.push({ loanId: loan.id, amountCents: applied });
    left -= applied;
  }

  return { allocations, unallocatedCents: left };
}