const CHARSETS = {
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  NUMBERS: '0123456789',
  SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

/**
 * Generates a secure random password.
 * @param length The desired length of the password.
 * @returns A randomly generated password string.
 */
export function generateSecurePassword(length: number = 16): string {
  const allChars = Object.values(CHARSETS).join('');
  let password = '';

  // Ensure at least one character from each set for strength
  password += CHARSETS.UPPERCASE[Math.floor(Math.random() * CHARSETS.UPPERCASE.length)];
  password += CHARSETS.LOWERCASE[Math.floor(Math.random() * CHARSETS.LOWERCASE.length)];
  password += CHARSETS.NUMBERS[Math.floor(Math.random() * CHARSETS.NUMBERS.length)];
  password += CHARSETS.SYMBOLS[Math.floor(Math.random() * CHARSETS.SYMBOLS.length)];

  // Fill the rest of the password length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to randomize the order of the guaranteed characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}
