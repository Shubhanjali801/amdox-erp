import { appEmitter } from './eventEmitter';

// Events: login, logout, mfa-enabled
export const emit = (event: string, payload: any) => appEmitter.emit(event, payload);
export const on   = (event: string, handler: (payload: any) => void) => appEmitter.on(event, handler);
