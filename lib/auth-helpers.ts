export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * Check if a user is admin by their user ID
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/db');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return isAdmin(user?.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get admin status for a user by ID
 */
export async function getUserAdminStatus(userId: string): Promise<boolean> {
  return isAdminUser(userId);
}

