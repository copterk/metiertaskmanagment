
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  STARTED = 'STARTED',
  BLOCKED = 'BLOCKED',
  HOLD = 'HOLD',
  REVISION = 'REVISION',
  DONE = 'DONE'
}

export type ProjectStatus = 'active' | 'closed';
export type UserStatus = 'active' | 'inactive';
export type UserRole = 'admin' | 'user';
export type TimelineHealth = 'on-track' | 'at-risk' | 'delayed';

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  departmentId: string;
  role: UserRole;
  status: UserStatus;
  skills?: string[];
  capacity?: number; // max concurrent tasks (soft limit)
}

export interface TaskTypeConfig {
  id: string;
  name: string;
  estimatedHours: Record<string, number>; // deptId -> hours
}

export interface TaskPhase {
  id: string;
  teamId: string;
  userId: string;
  startDate: string;
  endDate: string;
  actualEndDate?: string; // for delay tracking
  status: TaskStatus;
  order: number;
  dependsOn?: string; // phase id that must finish first
}

export interface Project {
  id: string;
  codename: string;
  name: string; // display name
  owner?: string; // userId
  status: ProjectStatus;
}

export interface Task {
  id: string;
  projectId: string;
  taskTypeId: string;
  title: string;
  phases: TaskPhase[];
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  delayReason?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  entityType: 'task' | 'project' | 'user' | 'department' | 'taskType';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string; // who made the change
}

export interface TaskTemplate {
  id: string;
  name: string;
  taskTypeId: string;
  defaultPhases: {
    teamId: string;
    order: number;
    dependsOnPrev: boolean; // auto-chain to previous phase
  }[];
}

export interface AppData {
  projects: Project[];
  departments: Department[];
  users: User[];
  taskTypes: TaskTypeConfig[];
  tasks: Task[];
  activityLog: ActivityLogEntry[];
  taskTemplates: TaskTemplate[];
}

export type Language = 'en' | 'th';
