export function isAuthorizedForAdmin(email: string) {
  const emails = ["ethan@metrik.app", "azurex443@gmail.com"];
  return emails.includes(email);
}
