// Types mirrored from root types.ts — kept in sync manually
// to avoid cross-project import issues in the server build.

export enum TaskStatus {
    NOT_STARTED = 'NOT_STARTED',
    STARTED = 'STARTED',
    BLOCKED = 'BLOCKED',
    HOLD = 'HOLD',
    REVISION = 'REVISION',
    DONE = 'DONE',
}
