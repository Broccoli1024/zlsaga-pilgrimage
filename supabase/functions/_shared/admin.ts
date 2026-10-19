/** Both identity and DB authorization must succeed; callers cannot supply a target UID. */
export async function authorizeAdmin(
  verifyUser: () => Promise<boolean>,
  checkRole: () => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<boolean> {
  try {
    if (!(await verifyUser())) return false;
    const { data, error } = await checkRole();
    return !error && data === true;
  } catch {
    return false;
  }
}
