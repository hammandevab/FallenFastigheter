import { Counter } from '../models/Counter.js';

/** Löpande ärendenummer, startar på 1001. */
export async function nextArendenummer() {
  const c = await Counter.findOneAndUpdate(
    { _id: 'felanmalan' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return 1000 + c.seq;
}
