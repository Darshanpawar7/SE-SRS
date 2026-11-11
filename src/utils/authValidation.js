const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

export const isValidAccountPassword = password => PASSWORD_PATTERN.test(String(password ?? ''));

export const validateAccountName = name => {
  const clean = String(name ?? '').trim();
  if (!clean || clean.length > 100) throw new Error('Enter a name of 1 to 100 characters.');
  return clean;
};

export const validateAccountPassword = password => {
  if (!isValidAccountPassword(password)) {
    throw new Error('Use 8–128 characters with a lowercase letter, uppercase letter and number.');
  }
};
