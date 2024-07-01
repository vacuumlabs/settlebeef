export const normalizeHandle = (handle: string) => {
  return handle.replaceAll(" ", "").replaceAll("@", "").toLowerCase()
}
