import { Tenant } from '../models/Tenant.js';
import { Tenancy } from '../models/Tenancy.js';
import { AppError } from '../utils/appError.js';

/**
 * Radnivåskydd (§2.3, §5.8): allt portalen visar utgår från detta scope.
 * Avslutade hyresförhållanden behåller läsåtkomst i 90 dagar (§8.5).
 */
export async function portalScope(user) {
  const tenant = await Tenant.findOne({ user: user._id });
  if (!tenant) throw new AppError('Ditt konto är inte kopplat till något hyresförhållande ännu. Kontakta oss så hjälper vi dig.', 403);
  const grans = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const tenancies = await Tenancy.find({
    tenant: tenant._id,
    $or: [
      { status: { $in: ['kommande', 'pagaende', 'uppsagd'] } },
      { status: 'avslutad', slutdatum: { $gte: grans } },
    ],
  }).populate({ path: 'unit', populate: { path: 'property' } });

  const unitIds = tenancies.map((t) => t.unit?._id).filter(Boolean);
  const propertyIds = [...new Set(tenancies.map((t) => t.unit?.property?._id?.toString()).filter(Boolean))];
  return { tenant, tenancies, unitIds, propertyIds };
}
