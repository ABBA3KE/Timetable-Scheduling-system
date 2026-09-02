// Tiny classnames helper (avoids pulling in an extra dependency for one function).
export function cn(...args) {
  return args.filter(Boolean).join(" ");
}
