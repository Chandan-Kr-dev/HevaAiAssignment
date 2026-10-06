// Paise stay integers until the very last render step; formatting is the
// only place a float-like representation (decimal string) ever appears.
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}
