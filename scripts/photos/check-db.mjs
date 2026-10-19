// Local PostgreSQL/WASM only. Never accepts a remote connection string.
import { readFile } from "node:fs/promises";
const { PGlite } = await import(
  process.env.PGLITE_MODULE || "@electric-sql/pglite"
);
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated;
create schema auth; create schema storage;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema public, auth, storage to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create table public.spots(id uuid primary key, is_published boolean);
insert into public.spots values('a0000000-0000-4000-8000-000000000001',true);
grant select on public.spots to anon,authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb);
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to anon,authenticated;
insert into auth.users values
('f1111111-1111-4111-8111-111111111111','owner@example.invalid',now()),
('f2222222-2222-4222-8222-222222222222','other@example.invalid',now()),
('f3333333-3333-4333-8333-333333333333','rikurin2016@gmail.com',now());
`);
await db.exec(
  await readFile(
    new URL(
      "../../supabase/migrations/20261017000000_spot_photos.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const owner = "f1111111-1111-4111-8111-111111111111";
const other = "f2222222-2222-4222-8222-222222222222";
const admin = "f3333333-3333-4333-8333-333333333333";
const spot = "a0000000-0000-4000-8000-000000000001";
async function as(role, id = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec(`set role ${role}`);
}
async function mustReject(sql, params = []) {
  try {
    await db.query(sql, params);
  } catch {
    return;
  }
  throw Error("Expected rejection: " + sql);
}
function check(value, label) {
  if (!value) throw Error(label);
  console.log("PASS:", label);
}
await as("authenticated", owner);
const {
  rows: [photo],
} = await db.query("select * from public.reserve_spot_photo($1,$2)", [
  spot,
  "Test photo",
]);
await mustReject(
  "update public.spot_photos set status='approved' where id=$1",
  [photo.id],
);
await mustReject("select public.submit_spot_photo($1)", [photo.id]);
await db.query(
  "insert into storage.objects(bucket_id,name) values ('spot-photos',$1)",
  [photo.storage_path],
);
await db.query("select public.submit_spot_photo($1)", [photo.id]);
await mustReject("select public.review_spot_photo($1,'approved')", [photo.id]);
await mustReject("select public.delete_spot_photo_record($1)", [photo.id]);
check(
  true,
  "owner cannot self-approve, submit missing file, or orphan stored image",
);
for (const [role, id] of [
  ["anon", ""],
  ["authenticated", other],
]) {
  await as(role, id);
  check(
    (await db.query("select * from public.spot_photos")).rows.length === 0,
    `${role} cannot see pending metadata`,
  );
  check(
    (await db.query("select * from storage.objects")).rows.length === 0,
    `${role} cannot see pending image`,
  );
  await mustReject(
    "insert into storage.objects(bucket_id,name) values('spot-photos','forged.jpg')",
  );
}
await as("authenticated", admin);
await db.query("select public.review_spot_photo($1,'approved')", [photo.id]);
await as("anon");
check(
  (await db.query("select * from public.spot_photos")).rows.length === 1,
  "approved photo visible to guests",
);
check(
  (await db.query("select * from storage.objects")).rows.length === 1,
  "approved file readable to guests",
);
await as("authenticated", other);
await db.query(
  "insert into public.spot_photo_reports(photo_id,user_id,reason) values($1,$2,$3)",
  [photo.id, other, "Test report"],
);
await mustReject(
  "insert into public.spot_photo_reports(photo_id,user_id,reason) values($1,$2,$3)",
  [photo.id, owner, "Forged"],
);
await as("authenticated", owner);
check(
  (
    await db.query(
      "update storage.objects set metadata='{}' where name=$1 returning *",
      [photo.storage_path],
    )
  ).rows.length === 0,
  "approved file cannot be replaced",
);
for (let i = 1; i < 30; i++)
  await db.query("select public.reserve_spot_photo($1)", [spot]);
await mustReject("select public.reserve_spot_photo($1)", [spot]);
check(true, "quota enforced by database");
await as("authenticated", admin);
await db.query("select public.review_spot_photo($1,'rejected')", [photo.id]);
await as("anon");
check(
  (await db.query("select * from public.spot_photos")).rows.length === 0,
  "rejected photo hidden",
);
await as("authenticated", owner);
await db.query("delete from storage.objects where name=$1", [
  photo.storage_path,
]);
await db.query("select public.delete_spot_photo_record($1)", [photo.id]);
check(
  (await db.query("select * from public.spot_photos where id=$1", [photo.id]))
    .rows.length === 0,
  "owner can remove object then metadata",
);
// Safety migration: this remains a local in-memory database only.
await as('postgres');
await db.exec(`
create role service_role bypassrls;
grant usage on schema public,auth,storage to service_role;
alter table storage.objects add column owner_id text;
create table public.users(id uuid primary key references auth.users(id) on delete cascade);
insert into public.users select id from auth.users;
create table public.routes(id uuid primary key,user_id uuid references public.users(id) on delete cascade);
create table public.event_logs(id int,user_id uuid references public.users(id) on delete set null,route_id uuid references public.routes(id) on delete set null);
create table public.spot_merge_backups(id int,related_data jsonb);
`);
await db.exec(await readFile(new URL('../../supabase/migrations/20261018000000_account_safety.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../../supabase/migrations/20261019010000_scope_account_cleanup.sql',import.meta.url),'utf8'));
const photo2 = 'e0000000-0000-4000-8000-000000000001';
await db.query("insert into public.spot_photos(id,spot_id,user_id,storage_path,status) values($1,$2,$3,$4,'approved')",[photo2,spot,owner,`${owner}/${photo2}.jpg`]);
await as('authenticated',other);
await db.query('select public.report_photo_author($1,$2)',[photo2,'Test author report']);
await db.query('insert into public.user_blocks(user_id,blocked_user_id) values($1,$2)',[other,owner]);
check((await db.query('select * from public.spot_photos where id=$1',[photo2])).rows.length===0,'blocked author hidden by RLS');
await mustReject('insert into public.user_blocks(user_id,blocked_user_id) values($1,$1)',[other]);
await mustReject('insert into public.user_blocks(user_id,blocked_user_id) values($1,$2)',[owner,other]);
await mustReject("select public.begin_account_deletion($1)",[owner]);
await mustReject("select public.delete_account_activity($1)",[owner]);
check(true,'cannot block self, forge another block, or invoke privileged deletion');
await as('authenticated',owner);
check((await db.query('select * from public.user_reports')).rows.length===0,'reporter identity is hidden from reported author');
await as('authenticated',admin);
const reports=await db.query('select * from public.user_reports');
check(reports.rows.length===1,'administrator can review author reports');
await db.query('select public.resolve_user_report($1,true)',[reports.rows[0].id]);
await as('anon');
check((await db.query('select * from public.spot_photos where id=$1',[photo2])).rows.length===0,'moderator can hide reported author photos');
await as('authenticated',other);
await db.query('delete from public.user_blocks where blocked_user_id=$1',[owner]);
check(!(await db.query('select public.has_blocked_author($1) as blocked',[owner])).rows[0].blocked,'unblock restores author visibility preference');
await as('postgres');
await db.query('insert into public.routes values($1,$2)',[spot,owner]);
await db.query('insert into public.event_logs values(1,$1,$2),(2,$3,null)',[owner,spot,other]);
await db.query('insert into public.spot_merge_backups values(1,$1)',[JSON.stringify({visit_logs:[{user_id:owner},{user_id:other}],route_spots:[{route_id:spot}]})]);
await db.exec(`
insert into public.spot_merge_backups values (2,'{}'), (3,'{"notes":"unrelated","items":[{"user_id":"unrelated"}]}');
create table public.cleanup_updates(id int);
create function public.track_cleanup_update() returns trigger language plpgsql as $$ begin insert into public.cleanup_updates values(new.id); return new; end; $$;
create trigger track_cleanup after update on public.spot_merge_backups for each row execute function public.track_cleanup_update();
`);
await db.query("insert into storage.objects(bucket_id,name,owner_id) values('profile-icons',$1,$2)",[`${owner}/icon.png`,owner]);
await as('service_role');
await db.query('select public.begin_account_deletion($1)',[owner]);
await mustReject('select public.begin_account_deletion($1)',[owner]);
check((await db.query('select * from public.account_deletion_objects($1)',[owner])).rows.length===1,'deletion inventory includes profile image');
await as('authenticated',owner);
await mustReject('select public.reserve_spot_photo($1)',[spot]);
await mustReject("insert into storage.objects(bucket_id,name) values('spot-photos',$1)",[`${owner}/new.jpg`]);
check(true,'deletion lock prevents new uploads and reservations');
await as('service_role');
await db.query('select public.delete_account_activity($1)',[owner]);
await as('postgres');
check((await db.query('select * from public.event_logs')).rows.length===1,'only deleting user activity is removed');
const backup=(await db.query('select related_data from public.spot_merge_backups where id=1')).rows[0].related_data;
check(backup.visit_logs.length===1 && backup.visit_logs[0].user_id===other && backup.route_spots.length===0,'historical backup removes user and route data, retains other users');
check(JSON.stringify((await db.query('select id from public.cleanup_updates')).rows)===JSON.stringify([{id:1}]),'cleanup updates only matching backup rows, leaving unrelated and empty backups untouched');
await as('service_role');
await db.query('select public.delete_account_activity($1)',[owner]);
await as('postgres');
check((await db.query('select * from public.cleanup_updates')).rows.length===1,'retry does not update already cleaned backups');
await db.query('delete from storage.objects where owner_id=$1',[owner]);
await db.query('delete from auth.users where id=$1',[owner]);
check((await db.query('select * from public.spot_photos where user_id=$1',[owner])).rows.length===0,'account deletion cascades to photo metadata');
check((await db.query('select * from public.routes where user_id=$1',[owner])).rows.length===0,'account deletion cascades to saved routes');
await as('authenticated',owner);
check(!(await db.query('select public.can_upload_for_account() as allowed')).rows[0].allowed,'deleted account cannot upload with an unexpired token');
await as('postgres');
await db.exec(await readFile(new URL('../../supabase/migrations/20261019000000_resolve_photo_reports.sql', import.meta.url), 'utf8'));
const reportPhoto = 'b0000000-0000-4000-8000-000000000009';
await db.query("insert into public.spot_photos(id,spot_id,user_id,storage_path,status) values($1,$2,$3,$4,'approved')",[reportPhoto,spot,other,`${other}/${reportPhoto}.jpg`]);
await as('authenticated',other);
await mustReject('insert into public.spot_photo_reports(photo_id,user_id,reason,resolved_at) values($1,$2,$3,now())',[reportPhoto,other,'forged resolved']);
await db.query('insert into public.spot_photo_reports(photo_id,user_id,reason) values($1,$2,$3)',[reportPhoto,other,'test report']);
await mustReject('select public.resolve_spot_photo_report($1,$2)',[reportPhoto,other]);
check(true,'ordinary users cannot resolve reports or insert a resolved timestamp');
await as('anon');
await mustReject('select public.resolve_spot_photo_report($1,$2)',[reportPhoto,other]);
check(true,'anonymous callers cannot resolve photo reports');
await as('authenticated',admin);
await db.query('insert into public.spot_photo_reports(photo_id,user_id,reason) values($1,$2,$3)',[reportPhoto,admin,'separate report']);
await db.query('select public.resolve_spot_photo_report($1,$2)',[reportPhoto,other]);
const flags=(await db.query('select user_id,resolved_at from public.spot_photo_reports where photo_id=$1',[reportPhoto])).rows;
check(flags.find(r=>r.user_id===other).resolved_at !== null && flags.find(r=>r.user_id===admin).resolved_at === null,'admin resolves only the selected report and preserves other reports');
check((await db.query('select status from public.spot_photos where id=$1',[reportPhoto])).rows[0].status==='approved','resolving a report leaves photo published');
await as('postgres');
await db.exec(`
alter table public.spots enable row level security;
grant insert, update, delete on public.spots to authenticated;
create policy spots_read on public.spots for select using(true);
create policy spots_admin_insert on public.spots for insert with check(false);
create policy spots_admin_update on public.spots for update using(false) with check(false);
create policy spots_admin_delete on public.spots for delete using(false);
create table public.form_response_log(id int);
alter table public.form_response_log enable row level security;
create policy form_response_log_admin_read on public.form_response_log for select using(false);
create table public.spot_significance_tags(spot_id uuid);
alter table public.spot_significance_tags enable row level security;
create policy spot_sig_tags_admin_insert on public.spot_significance_tags for insert with check(false);
create policy spot_sig_tags_admin_delete on public.spot_significance_tags for delete using(false);
`);
await db.exec(await readFile(new URL('../../supabase/migrations/20261019020000_admin_membership.sql',import.meta.url),'utf8'));
check((await db.query('select user_id from public.admin_memberships')).rows[0].user_id===admin,'migration preserves the existing administrator');
await as('anon');
check(!(await db.query('select public.is_admin() as allowed')).rows[0].allowed,'anonymous caller is not admin');
await as('authenticated',other);
check(!(await db.query('select public.is_admin() as allowed')).rows[0].allowed,'ordinary account is not admin');
await mustReject("insert into public.spots values('c0000000-0000-4000-8000-000000000001',true)");
await mustReject('select * from public.admin_memberships');
await mustReject('insert into public.admin_memberships(user_id) values($1)',[other]);
await mustReject('delete from public.admin_memberships where user_id=$1',[admin]);
await mustReject('update public.admin_memberships set user_id=$1',[other]);
check(true,'client cannot list or change admin memberships');
await as('postgres');
await db.query('update auth.users set email=$1 where id=$2',['changed@example.invalid',admin]);
await as('authenticated',admin);
check((await db.query('select public.is_admin() and public.is_photo_admin() as allowed')).rows[0].allowed,'email changes retain UID-based admin and photo permissions');
await db.query("insert into public.spots values('c0000000-0000-4000-8000-000000000001',true)");
check(true,'existing spot-write policy accepts UID membership after email change');
await as('postgres');
await db.query('delete from public.admin_memberships where user_id=$1',[admin]);
await as('authenticated',admin);
check(!(await db.query('select public.is_admin() or public.is_photo_admin() as allowed')).rows[0].allowed,'revocation takes effect for the same signed-in identity');
await mustReject('select public.resolve_spot_photo_report($1,$2)',[reportPhoto,other]);
await mustReject("insert into public.spots values('c0000000-0000-4000-8000-000000000002',true)");
check(true,'revoked admin cannot perform privileged photo or spot actions');
await as('postgres');
await db.exec(`create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$; grant execute on function auth.jwt() to anon,authenticated;`);
await db.query('insert into public.admin_memberships(user_id) values($1)',[admin]);
await db.exec(await readFile(new URL('../../supabase/migrations/20261019030000_admin_mfa.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../../supabase/migrations/20261019031000_require_admin_mfa.sql',import.meta.url),'utf8'));
await as('authenticated',admin);
await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({aal:'aal1'})]);
check((await db.query('select public.is_admin_member() as member,public.is_admin() as allowed')).rows[0].member && !(await db.query('select public.is_admin() as allowed')).rows[0].allowed,'password-only admin can enroll but cannot administer');
await mustReject('select public.resolve_spot_photo_report($1,$2)',[reportPhoto,other]);
await mustReject("insert into public.spots values('c0000000-0000-4000-8000-000000000003',true)");
check(true,'photo and spot policies require MFA');
await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({aal:'aal2'})]);
check((await db.query('select public.is_admin() and public.is_photo_admin() as allowed')).rows[0].allowed,'admin with MFA can administer');
await db.query('select public.resolve_spot_photo_report($1,$2)',[reportPhoto,admin]);
await as('authenticated',other);
check(!(await db.query('select public.is_admin() as allowed')).rows[0].allowed,'MFA does not grant membership to ordinary users');
await as('anon');
check(!(await db.query('select public.is_admin() as allowed')).rows[0].allowed,'anonymous identity cannot obtain admin access with AAL claim');
await db.close();
