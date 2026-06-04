export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * Check if a user is admin by their user ID (ADMIN_EMAILS env or DB role)
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/db');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });
    if (!user) return false;
    return user.role === 'admin' || isAdmin(user.email);
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

/**
 * Check if a user is manager by their user ID (DB role)
 */
export async function isManagerUser(userId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/db');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'manager';
  } catch (error) {
    console.error('Error checking manager status:', error);
    return false;
  }
}

/**
 * Check if a user is admin or manager (can archive tasks)
 */
export async function isAdminOrManagerUser(userId: string): Promise<boolean> {
  const [admin, manager] = await Promise.all([
    isAdminUser(userId),
    isManagerUser(userId),
  ]);
  return admin || manager;
}

