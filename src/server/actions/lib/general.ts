export const normalizeHandle = (handle: string) => {
  const lower = handle.toLowerCase()

  return lower.startsWith("@") ? lower.replace("@", "") : lower
}
