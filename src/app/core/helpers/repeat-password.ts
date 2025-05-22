import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pass = group.get('password')?.value;
  const repeat = group.get('repeat_password')?.value;
  // Si coinciden, no hay error; si no, devolvemos el error 'passwordMismatch'
  return pass === repeat ? null : { passwordMismatch: true };
};