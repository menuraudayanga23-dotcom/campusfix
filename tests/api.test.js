/* Integration test creates a uniquely named database and drops ONLY that test database. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const app = require('../backend/app');
const User = require('../backend/models/User');
const Session = require('../backend/models/Session');
const { hashPassword } = require('../backend/password');
test('API workflow, persistence and access boundaries', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const dbName = 'campusfix_test_' + randomUUID().replaceAll('-', '');
  await mongoose.connect(process.env.TEST_MONGO_URI, { dbName, serverSelectionTimeoutMS: 5000 });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.APP_ORIGIN = base;
  const request = async (path, method = 'GET', body, cookie = '', origin = base) => {
    const res = await fetch(base + path, { method, headers: { Origin: origin, Cookie: cookie,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json(); return { status: res.status, data, cookie: (res.headers.getSetCookie().at(-1) || '').split(';')[0] };
  };
  try {
    await Promise.all([User.init(), Session.init()]);
    assert.equal((await request('/api/health')).status, 200);
    assert.equal((await request('/api/reports')).status, 401);
    const first = await request('/api/auth/register','POST', { name:'Student One', email:'one@example.com',password:'StudentPassword42!',role:'admin' });
    assert.equal(first.status,201); assert.equal(first.data.user.role,'student');
    assert.equal('passwordHash' in first.data.user,false);
    const second = await request('/api/auth/register','POST', { name:'Student Two',email:'two@example.com',password:'StudentPassword42!' });
    assert.equal((await request('/api/auth/register','POST',{ name:'Duplicate',email:'one@example.com',password:'StudentPassword42!' })).status,409);
    assert.equal((await request('/api/auth/login','POST',{ email:'one@example.com',password:'WrongPassword42!' })).status,401);
    const payload = { title:'Broken lecture desk',type:'Damage',category:'Furniture',location:'Hall 2',description:'The desk leg is broken and requires replacement.',priority:'High' };
    assert.equal((await request('/api/reports','POST',payload,first.cookie,'https://other.example')).status,403);
    assert.equal((await request('/api/reports','POST',{...payload,title:'x'},first.cookie)).status,400);
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6XQAAAAASUVORK5CYII=';
    const created = await request('/api/reports','POST',{ ...payload,photo:png,status:'Resolved' },first.cookie);
    assert.equal(created.status,201); const id = created.data.report._id;
    assert.equal(created.data.report.status,'Submitted'); assert.equal(created.data.report.hasPhoto,true);
    assert.equal('photo' in created.data.report,false);
    assert.equal((await request(`/api/reports/${id}`,'GET',undefined,second.cookie)).status,404);
    assert.equal((await request(`/api/reports/${id}/photo`,'GET',undefined,second.cookie)).status,404);
    assert.equal((await request('/api/reports','GET',undefined,second.cookie)).data.total,0);
    assert.equal((await request(`/api/reports/${id}/status`,'PATCH',{status:'Resolved',note:'Fixed.'},first.cookie)).status,403);
    assert.equal((await request('/api/reports?q=desk','GET',undefined,first.cookie)).data.total,1);
    assert.equal((await request('/api/reports?q=%5B','GET',undefined,first.cookie)).status,200);
    assert.equal((await request('/api/reports?page=0','GET',undefined,first.cookie)).status,400);
    await User.create({ name:'Administrator',email:'admin@example.com',passwordHash:await hashPassword('AdminPassword42!'),role:'admin' });
    const admin = await request('/api/auth/login','POST',{email:'admin@example.com',password:'AdminPassword42!'});
    assert.equal(admin.status,200);
    assert.equal((await request('/api/reports','GET',undefined,admin.cookie)).data.total,1);
    const updated = await request(`/api/reports/${id}/status`,'PATCH',{status:'Resolved',note:'Desk replaced by maintenance.'},admin.cookie);
    assert.equal(updated.status,200); assert.equal(updated.data.report.updates.length,2);
    const detail = await request(`/api/reports/${id}`,'GET',undefined,first.cookie);
    assert.equal(detail.data.report.status,'Resolved');
    assert.equal((await request('/api/reports/stats','GET',undefined,admin.cookie)).data.counts.Resolved,1);
    const image = await fetch(`${base}/api/reports/${id}/photo`,{headers:{Cookie:first.cookie}});
    assert.equal(image.status,200); assert.equal(image.headers.get('content-type'),'image/png');
    assert.equal((await request('/api/auth/logout','POST',{},first.cookie)).status,200);
    assert.equal((await request('/api/auth/me','GET',undefined,first.cookie)).status,401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
