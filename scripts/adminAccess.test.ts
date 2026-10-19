import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeAdmin } from '../supabase/functions/_shared/admin.ts';
test('admin endpoints require both a verified identity and explicit DB membership', async () => {
  let checks = 0;
  const allowed = async () => { checks++; return {data:true,error:null}; };
  assert.equal(await authorizeAdmin(async()=>false,allowed),false);
  assert.equal(checks,0);
  assert.equal(await authorizeAdmin(async()=>true,allowed),true);
  assert.equal(await authorizeAdmin(async()=>true,async()=>({data:false,error:null})),false);
  assert.equal(await authorizeAdmin(async()=>true,async()=>({data:'true',error:null})),false);
});
test('admin endpoints deny access when identity or role verification fails',async()=>{
  assert.equal(await authorizeAdmin(async()=>{throw Error('offline');},async()=>({data:true,error:null})),false);
  assert.equal(await authorizeAdmin(async()=>true,async()=>({data:true,error:{message:'offline'}})),false);
  assert.equal(await authorizeAdmin(async()=>true,async()=>{throw Error('offline');}),false);
});
