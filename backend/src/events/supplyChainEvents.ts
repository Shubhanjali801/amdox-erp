import { appEmitter } from './eventEmitter';

// Events: po-approved, gr-received, stock-low
export const emit = (event: string, payload: any) => appEmitter.emit(event, payload);
export const on   = (event: string, handler: (payload: any) => void) => appEmitter.on(event, handler);
