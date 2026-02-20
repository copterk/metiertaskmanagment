/**
 * Seed script: populates the Google Sheet with initial data from mockData.
 * Usage: npm run seed  (from within server/)
 *
 * Run ONCE when setting up a new sheet, or after clearing the sheet.
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });


import { ensureSheet, clearAndWriteAll, SHEETS } from './sheetsRepository';
import { TaskStatus } from './types';

const INITIAL_DATA = {
    projects: [
        { id: 'p1', codename: 'PHOENIX', name: 'Website Redesign 2024', owner: '', status: 'active' },
        { id: 'p2', codename: 'FALCON', name: 'Mobile App Launch', owner: '', status: 'active' },
        { id: 'p3', codename: 'AURORA', name: 'Q1 Marketing Campaign', owner: '', status: 'active' },
    ],
    departments: [
        { id: 'd1', name: 'Design' },
        { id: 'd2', name: 'Frontend' },
        { id: 'd3', name: 'Backend' },
        { id: 'd4', name: 'QA' },
    ],
    users: [
        { id: 'u1', name: 'สมชาย ดีใจ', departmentId: 'd1', role: 'admin', status: 'active', skills: ['UI Design', 'Figma'], capacity: 5 },
        { id: 'u2', name: 'สมศรี มีความสุข', departmentId: 'd1', role: 'user', status: 'active', skills: ['Illustration', 'Branding'], capacity: 4 },
        { id: 'u3', name: 'กิตติพงษ์ เก่งกาจ', departmentId: 'd2', role: 'user', status: 'active', skills: ['React', 'TypeScript'], capacity: 5 },
        { id: 'u4', name: 'พรทิพย์ เพลินจิต', departmentId: 'd2', role: 'user', status: 'active', skills: ['CSS', 'Vue'], capacity: 4 },
        { id: 'u5', name: 'อำนาจ อาจหาญ', departmentId: 'd3', role: 'user', status: 'active', skills: ['Node.js', 'PostgreSQL'], capacity: 4 },
        { id: 'u6', name: 'นารี รุ่งเรือง', departmentId: 'd4', role: 'user', status: 'active', skills: ['Manual Testing', 'Automation'], capacity: 6 },
    ],
    taskTypes: [
        { id: 'tt1', name: 'Landing Page Build', estimatedHours: { d1: 16, d2: 24, d3: 8, d4: 4 } },
        { id: 'tt2', name: 'API Development', estimatedHours: { d3: 40, d4: 16 } },
        { id: 'tt3', name: 'UI Components', estimatedHours: { d1: 20, d2: 32 } },
    ],
    tasks: [
        {
            id: 't1', projectId: 'p1', taskTypeId: 'tt1', title: 'Homepage Revamp',
            link: 'https://figma.com/file/123', priority: 'high', delayReason: '',
            phases: [
                { id: 'ph1', teamId: 'd1', userId: 'u1', startDate: '2024-05-01', endDate: '2024-05-03', status: TaskStatus.DONE, order: 1 },
                { id: 'ph2', teamId: 'd2', userId: 'u3', startDate: '2024-05-04', endDate: '2024-05-10', status: TaskStatus.STARTED, order: 2, dependsOn: 'ph1' },
            ],
        },
        {
            id: 't2', projectId: 'p2', taskTypeId: 'tt2', title: 'User Authentication Flow',
            link: 'https://github.com/org/repo/pull/45', priority: 'urgent', delayReason: '',
            phases: [
                { id: 'ph3', teamId: 'd3', userId: 'u5', startDate: '2024-05-05', endDate: '2024-05-15', status: TaskStatus.BLOCKED, order: 1 },
            ],
        },
    ],
    activityLog: [],
    taskTemplates: [
        {
            id: 'tpl1', name: 'Standard Landing Page', taskTypeId: 'tt1',
            defaultPhases: [
                { teamId: 'd1', order: 1, dependsOnPrev: false },
                { teamId: 'd2', order: 2, dependsOnPrev: true },
                { teamId: 'd3', order: 3, dependsOnPrev: true },
                { teamId: 'd4', order: 4, dependsOnPrev: true },
            ],
        },
    ],
};

async function seed() {
    console.log('🌱 Starting seed...');
    for (const sheetName of Object.keys(SHEETS)) {
        console.log(`  📄 Setting up sheet: ${sheetName}`);
        await ensureSheet(sheetName);
        const data = (INITIAL_DATA as any)[sheetName] ?? [];
        await clearAndWriteAll(sheetName, data);
        console.log(`     ✅ Written ${data.length} row(s)`);
    }
    console.log('\n✔ Seed complete! Your Google Sheet is ready.');
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
