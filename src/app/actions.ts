'use server';

import { readIntake, validateIntake, type IntakeState } from '@/lib/intake';

/**
 * Receives the Séance intake form. Re-validates everything — the client checks are
 * a convenience, this is the source of truth.
 */
export async function submitIntake(_prev: IntakeState, formData: FormData): Promise<IntakeState> {
  const values = readIntake(formData);
  const errors = validateIntake(values);

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', errors, values };
  }

  // V1 stub: nothing is stored yet. Replace this delay with the real write
  // (CRM, database, email notification) when there's a backend to talk to.
  await new Promise((resolve) => setTimeout(resolve, 900));

  return { status: 'success', name: values.name, email: values.email };
}
