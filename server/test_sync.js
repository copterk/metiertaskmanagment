
const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

async function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        // Parse URL manually
        const url = new URL(BASE_URL + path);
        options.hostname = url.hostname;
        options.port = url.port;
        options.path = url.pathname;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testSync() {
    const newTask = {
        id: `test_sync_${Date.now()}`,
        title: `Sync Test ${new Date().toISOString()}`,
        projectId: 'p1',
        taskTypeId: 'tt1',
        priority: 'medium',
        phases: []
    };

    console.log('1. Creating task...', newTask.id);
    const createRes = await request('POST', '/tasks', newTask);

    if (createRes.status !== 201) {
        console.error('❌ Create failed:', createRes.status, createRes.body);
        return;
    }
    console.log('✅ Created.');

    console.log('2. Fetching all tasks immediately...');
    const listRes = await request('GET', '/tasks');
    const tasks = listRes.body;

    if (!Array.isArray(tasks)) {
        console.error('❌ Failed to list tasks. Response:', tasks);
        return;
    }

    const found = tasks.find((t) => t.id === newTask.id);
    if (found) {
        console.log('✅ PASSED: Task found in list.', found.title);
    } else {
        console.error('❌ FAILED: Task NOT found in list immediately after creation.');
        console.log('   Total tasks retrieved:', tasks.length);
    }
}

testSync().catch(console.error);
