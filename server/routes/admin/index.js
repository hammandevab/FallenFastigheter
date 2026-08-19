import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.js';
import stats from './stats.js';
import properties from './properties.js';
import units from './units.js';
import tenants from './tenants.js';
import faults from './faults.js';
import leads from './leads.js';
import content from './content.js';
import users from './users.js';

const r = Router();
r.use(protect, restrictTo('admin'));
r.use(stats);
r.use('/fastigheter', properties);
r.use('/objekt', units);
r.use(tenants);
r.use('/felanmalningar', faults);
r.use('/leads', leads);
r.use(content);
r.use(users);

export default r;
