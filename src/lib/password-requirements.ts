export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One capital letter (A–Z)",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "One number (0–9)",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "One special character (!@#$%…)",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export type PasswordRequirementStatus = PasswordRequirement & { met: boolean };

export function getPasswordRequirementStatus(
  password: string
): PasswordRequirementStatus[] {
  return PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    met: req.test(password),
  }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}

export function getPasswordValidationError(password: string): string | null {
  if (isPasswordValid(password)) return null;
  return "Your password must meet all requirements listed below.";
}
