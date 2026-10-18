import test from 'node:test';
import assert from 'node:assert/strict';
import { deletionHandler } from '../supabase/functions/delete-account/handler.ts';
import type { DeletionDependencies } from '../supabase/functions/delete-account/handler.ts';
function fixture(overrides: Partial<DeletionDependencies> = {}) {
  const calls: string[] = [];
  const deps: DeletionDependencies = {
    async identify() { calls.push('identify'); return {id:'verified-user',email:'test@example.invalid'}; },
    async verifyPassword() { calls.push('verify'); return true; },
    async begin(id) { calls.push(`begin:${id}`); },
    async objects() { calls.push('objects'); return []; },
    async remove(bucket,paths) { calls.push(`remove:${bucket}:${paths.join(',')}`); },
    async removeActivity(id) { calls.push(`activity:${id}`); },
    async deleteUser(id) { calls.push(`delete:${id}`); },
    async markFailed(id) { calls.push(`failed:${id}`); },
    ...overrides,
  };
  return {handle:deletionHandler(deps),calls};
}
const request=(body:unknown={password:'test-only',confirmation:'DELETE'},token=true)=>new Request('https://example.invalid/delete-account',{method:'POST',headers:token?{Authorization:'Bearer test-token'}:{},body:JSON.stringify(body)});
test('unauthenticated and unconfirmed requests never reach deletion', async()=>{
  const f=fixture();assert.equal((await f.handle(request({},false))).status,401);assert.equal((await f.handle(request({password:'test'}))).status,400);assert.deepEqual(f.calls,[]);
});
test('wrong password cannot delete data',async()=>{const f=fixture({async verifyPassword(){return false;}});assert.equal((await f.handle(request())).status,403);assert.deepEqual(f.calls,['identify']);});
test('caller supplied user ID is ignored; only verified account is deleted',async()=>{const f=fixture();const res=await f.handle(request({password:'test',confirmation:'DELETE',userId:'victim'}));assert.equal(res.status,200);assert.deepEqual(f.calls,['identify','verify','begin:verified-user','objects','activity:verified-user','delete:verified-user']);});
test('all storage batches are removed before activity and account',async()=>{
  let page=0;const f=fixture({async objects(){return page++===0?[{bucket_id:'spot-photos',name:'u/p.jpg'},{bucket_id:'profile-icons',name:'u/icon.png'}]:page===2?[{bucket_id:'spot-photos',name:'u/second.jpg'}]:[];}});
  assert.equal((await f.handle(request())).status,200);
  assert.deepEqual(f.calls.slice(3),['remove:spot-photos:u/p.jpg','remove:profile-icons:u/icon.png','remove:spot-photos:u/second.jpg','activity:verified-user','delete:verified-user']);
});
test('storage failure stops before account deletion and exposes no provider secrets',async()=>{
  const f=fixture({async objects(){return [{bucket_id:'spot-photos',name:'u/p.jpg'}];},async remove(){throw new Error('secret-service-key');}});const r=await f.handle(request());assert.equal(r.status,503);assert.ok(f.calls.includes('failed:verified-user'));assert.ok(!f.calls.some(c=>c.startsWith('delete:')));assert.ok(!(await r.text()).includes('secret-service-key'));
});
test('concurrent or unavailable deletion cannot start cleanup',async()=>{const f=fixture({async begin(){throw Error('busy');}});assert.equal((await f.handle(request())).status,409);assert.ok(!f.calls.includes('objects'));});
test('activity cleanup failure never deletes the account',async()=>{const f=fixture({async removeActivity(){throw Error('failed');}});assert.equal((await f.handle(request())).status,503);assert.ok(!f.calls.some(c=>c.startsWith('delete:')));});
test('auth deletion failure reports incomplete, never success',async()=>{const f=fixture({async deleteUser(){throw Error('still owns an object');}});const r=await f.handle(request());assert.equal(r.status,503);assert.ok(f.calls.includes('failed:verified-user'));});
