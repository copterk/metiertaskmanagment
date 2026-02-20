
import React from 'react';
import { TaskStatus, Language } from './types';

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
};

export const STATUS_COLORS: Record<string, string> = {
  [TaskStatus.NOT_STARTED]: 'bg-gray-100 text-gray-600 border-gray-200',
  [TaskStatus.STARTED]: 'bg-blue-100 text-blue-600 border-blue-200',
  [TaskStatus.BLOCKED]: 'bg-red-100 text-red-600 border-red-200',
  [TaskStatus.HOLD]: 'bg-orange-100 text-orange-600 border-orange-200',
  [TaskStatus.REVISION]: 'bg-purple-100 text-purple-600 border-purple-200',
  [TaskStatus.DONE]: 'bg-green-100 text-green-600 border-green-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  high: 'bg-orange-50 text-orange-600 border-orange-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
};

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    nav_timeline: 'Timeline',
    nav_admin: 'Manage Tasks',
    nav_workload: 'Workload',
    nav_settings: 'Settings',
    btn_new_task: 'New Task',
    status: {
      [TaskStatus.NOT_STARTED]: 'Not Started',
      [TaskStatus.STARTED]: 'Started',
      [TaskStatus.BLOCKED]: 'Blocked',
      [TaskStatus.HOLD]: 'Hold',
      [TaskStatus.REVISION]: 'Revision',
      [TaskStatus.DONE]: 'Done',
    },
    priority: { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' },
    timeline_title: 'Project Timeline',
    timeline_desc: 'Track progress across all teams',
    timeline_view_project: 'View by Project',
    timeline_view_person: 'View by Employee',
    timeline_filter_all: 'All Employees',
    timeline_filter_status: 'All Statuses',
    timeline_filter_team: 'All Teams',
    admin_title: 'Admin Dashboard',
    admin_desc: 'Monitor and edit all system tasks',
    admin_search: 'Search task...',
    admin_filter_project: 'All Projects',
    admin_filter_team: 'All Teams',
    admin_filter_status: 'All Statuses',
    admin_sort_start: 'Sort by Start',
    admin_sort_end: 'Sort by Deadline',
    admin_sort_delay: 'Sort by Delay',
    admin_bulk_status: 'Bulk Status Update',
    admin_bulk_delete: 'Bulk Delete',
    workload_title: 'Workload Summary',
    workload_desc: 'Track pending tasks and estimated hours',
    workload_pending: 'Pending Tasks',
    workload_density: 'Workload Density',
    workload_recent: 'Recent Responsibilities',
    workload_empty: 'No Active Tasks',
    workload_view_person: 'By Person',
    workload_view_team: 'By Team',
    workload_view_project: 'By Project',
    workload_capacity: 'Capacity',
    workload_demand: 'Demand',
    settings_title: 'System Settings',
    settings_desc: 'Configure organization defaults',
    settings_tab_dept: 'Teams',
    settings_tab_types: 'Task Types',
    settings_tab_members: 'Members',
    settings_tab_projects: 'Projects',
    settings_tab_templates: 'Templates',
    settings_tab_logs: 'Activity Log',
    member_name: 'Name',
    member_team: 'Team',
    member_role: 'Role',
    member_status: 'Status',
    member_skills: 'Skills',
    member_capacity: 'Capacity',
    member_add: 'Add Member',
    member_active: 'Active',
    member_inactive: 'Inactive',
    project_codename: 'Codename',
    project_display: 'Display Name',
    project_owner: 'Owner',
    project_status: 'Status',
    project_add: 'Add Project',
    template_name: 'Template Name',
    template_add: 'Add Template',
    log_time: 'Time',
    log_action: 'Action',
    log_entity: 'Entity',
    log_detail: 'Detail',
    log_empty: 'No activity recorded yet',
    modal_edit: 'Edit Task',
    modal_create: 'Create New Task',
    modal_field_title: 'Task Title',
    modal_field_type: 'Task Type',
    modal_field_project: 'Project',
    modal_field_link: 'Resource Link',
    modal_field_priority: 'Priority',
    modal_field_delay_reason: 'Delay Reason',
    modal_phases: 'PHASES & ASSIGNMENTS',
    modal_add_phase: 'Add Next Phase',
    modal_team: 'Team',
    modal_assignee: 'Assignee',
    modal_period: 'Start - Deadline',
    modal_status: 'Status',
    modal_btn_cancel: 'Cancel',
    modal_btn_save: 'Save Changes',
    modal_btn_create: 'Create Task',
    modal_use_template: 'Use Template',
    health_on_track: 'On Track',
    health_at_risk: 'At Risk',
    health_delayed: 'Delayed',
    validation_required: 'This field is required',
    validation_date: 'Invalid date range',
  },
  th: {
    nav_timeline: 'ไทม์ไลน์งาน',
    nav_admin: 'จัดการงาน (Admin)',
    nav_workload: 'ภาระงานพนักงาน',
    nav_settings: 'ตั้งค่า',
    btn_new_task: 'สร้างงานใหม่',
    status: {
      [TaskStatus.NOT_STARTED]: 'ยังไม่เริ่ม',
      [TaskStatus.STARTED]: 'เริ่มแล้ว',
      [TaskStatus.BLOCKED]: 'ติด Block',
      [TaskStatus.HOLD]: 'Hold',
      [TaskStatus.REVISION]: 'ปรับปรุงแก้ไข',
      [TaskStatus.DONE]: 'เสร็จสิ้น',
    },
    priority: { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', urgent: 'เร่งด่วน' },
    timeline_title: 'ไทม์ไลน์งาน (Timeline)',
    timeline_desc: 'ติดตามความคืบหน้าของงานในแต่ละทีม',
    timeline_view_project: 'ดูตามโปรเจกต์',
    timeline_view_person: 'ดูตามพนักงาน',
    timeline_filter_all: 'ดูทุกคน',
    timeline_filter_status: 'ทุกสถานะ',
    timeline_filter_team: 'ทุกทีม',
    admin_title: 'จัดการงานทั้งหมด',
    admin_desc: 'ตรวจสอบและแก้ไขงานทุกชิ้นในระบบ',
    admin_search: 'ค้นหาชื่องาน...',
    admin_filter_project: 'ทุกโปรเจกต์',
    admin_filter_team: 'ทุกทีม',
    admin_filter_status: 'ทุกสถานะ',
    admin_sort_start: 'เรียงตามวันเริ่ม',
    admin_sort_end: 'เรียงตามวันส่ง',
    admin_sort_delay: 'เรียงตามวันเลื่อน',
    admin_bulk_status: 'เปลี่ยนสถานะหลายรายการ',
    admin_bulk_delete: 'ลบหลายรายการ',
    workload_title: 'สรุปภาระงาน (Workload Summary)',
    workload_desc: 'ติดตามจำนวนงานค้างและชั่วโมงประเมินของพนักงาน',
    workload_pending: 'งานค้าง',
    workload_density: 'ความหนาแน่น',
    workload_recent: 'งานที่รับผิดชอบล่าสุด',
    workload_empty: 'ว่างงาน',
    workload_view_person: 'รายบุคคล',
    workload_view_team: 'รายทีม',
    workload_view_project: 'รายโปรเจกต์',
    workload_capacity: 'ความจุ',
    workload_demand: 'ความต้องการ',
    settings_title: 'ตั้งค่าระบบ (Admin Config)',
    settings_desc: 'ปรับแต่งข้อมูลพื้นฐานขององค์กร',
    settings_tab_dept: 'ทีม/แผนก',
    settings_tab_types: 'ประเภทงาน',
    settings_tab_members: 'สมาชิก',
    settings_tab_projects: 'โปรเจกต์',
    settings_tab_templates: 'เทมเพลต',
    settings_tab_logs: 'ประวัติการแก้ไข',
    member_name: 'ชื่อ',
    member_team: 'ทีม',
    member_role: 'บทบาท',
    member_status: 'สถานะ',
    member_skills: 'ทักษะ',
    member_capacity: 'งานสูงสุด',
    member_add: 'เพิ่มสมาชิก',
    member_active: 'ใช้งาน',
    member_inactive: 'ไม่ใช้งาน',
    project_codename: 'รหัสโปรเจกต์',
    project_display: 'ชื่อแสดงผล',
    project_owner: 'เจ้าของ',
    project_status: 'สถานะ',
    project_add: 'เพิ่มโปรเจกต์',
    template_name: 'ชื่อเทมเพลต',
    template_add: 'เพิ่มเทมเพลต',
    log_time: 'เวลา',
    log_action: 'การกระทำ',
    log_entity: 'รายการ',
    log_detail: 'รายละเอียด',
    log_empty: 'ยังไม่มีประวัติการแก้ไข',
    modal_edit: 'แก้ไขงาน',
    modal_create: 'สร้างงานใหม่',
    modal_field_title: 'ชื่องาน',
    modal_field_type: 'ประเภทงาน',
    modal_field_project: 'โปรเจกต์',
    modal_field_link: 'ลิงก์แนบ (Link)',
    modal_field_priority: 'ลำดับความสำคัญ',
    modal_field_delay_reason: 'เหตุผลการเลื่อน',
    modal_phases: 'ขั้นตอนและผู้รับผิดชอบ (Phases)',
    modal_add_phase: 'เพิ่มขั้นตอนถัดไป',
    modal_team: 'ทีม',
    modal_assignee: 'คนรับผิดชอบ',
    modal_period: 'เริ่ม - ส่งงาน',
    modal_status: 'สถานะ',
    modal_btn_cancel: 'ยกเลิก',
    modal_btn_save: 'บันทึกการแก้ไข',
    modal_btn_create: 'สร้างงาน',
    modal_use_template: 'ใช้เทมเพลต',
    health_on_track: 'ตามแผน',
    health_at_risk: 'เสี่ยง',
    health_delayed: 'ล่าช้า',
    validation_required: 'จำเป็นต้องกรอก',
    validation_date: 'ช่วงวันที่ไม่ถูกต้อง',
  }
};

export const Icons = {
  Layout: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
  ),
  Calendar: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
  ),
  Users: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Settings: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  Search: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
  ),
  Plus: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
  ),
  Link: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
  ),
  CheckCircle: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ),
  Clock: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  X: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Globe: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
  ),
  Edit: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
  ),
  Trash: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
  ),
  AlertTriangle: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  Archive: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
  ),
  ChevronDown: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9" /></svg>
  ),
};
