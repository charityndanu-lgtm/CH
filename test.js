/**
 * Quick Start Test Suite
 * Run: node test.js
 */

const http = require('http');

const API_URL = 'http://localhost:3000';
let passed = 0;
let failed = 0;

function test(name, fn) {
  return new Promise((resolve) => {
    try {
      fn().then(() => {
        console.log(`✅ ${name}`);
        passed++;
        resolve();
      }).catch(e => {
        console.log(`❌ ${name}: ${e.message}`);
        failed++;
        resolve();
      });
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
      resolve();
    }
  });
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 PM Hub Test Suite\n');

  await test('Server is running', async () => {
    const res = await request('GET', '/api/state');
    if (res.status !== 200) throw new Error(`Got status ${res.status}`);
  });

  await test('GET /api/state returns teams', async () => {
    const res = await request('GET', '/api/state');
    if (!res.data.teams || res.data.teams.length === 0) throw new Error('No teams');
  });

  await test('GET /api/state returns metrics', async () => {
    const res = await request('GET', '/api/state');
    if (!res.data.metrics) throw new Error('No metrics');
  });

  await test('GET /api/state returns anomalies', async () => {
    const res = await request('GET', '/api/state');
    if (!res.data.anomalies) throw new Error('No anomalies');
  });

  await test('POST /api/ai returns response', async () => {
    const res = await request('POST', '/api/ai', { prompt: 'test' });
    if (!res.data.answer) throw new Error('No answer');
  });

  await test('POST /api/agenda creates meeting', async () => {
    const res = await request('POST', '/api/agenda', {
      target: 'Alpha',
      kind: 'standup',
      context: 'daily'
    });
    if (!res.data.meeting) throw new Error('No meeting');
  });

  await test('POST /api/discord-match creates entry', async () => {
    const res = await request('POST', '/api/discord-match', {
      name: 'Test User',
      skills: 'Python',
      interest: 'AI'
    });
    if (!res.data.entry) throw new Error('No entry');
  });

  await test('PATCH /api/team/:id/progress updates team', async () => {
    const res = await request('PATCH', '/api/team/Alpha/progress', {
      prog: 80,
      status: 'on-track'
    });
    if (!res.data.team) throw new Error('No team');
  });

  await test('PATCH /api/anomaly/:idx/resolve works', async () => {
    const res = await request('PATCH', '/api/anomaly/0/resolve', {});
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Check server logs.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e.message);
  process.exit(1);
});
