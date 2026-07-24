import * as admin from "firebase-admin";

admin.initializeApp();

// Triggers
export { approveAndPayTask } from './triggers/payouts';
export { dailyFarmTaskScheduler, staleTaskCleanup } from './triggers/scheduler';
export { onSensorReading } from './triggers/iot-listener';

// Callable Functions
export { generateDigitalDeed } from './callable/generate-deed';
export { validateVoucher } from './callable/validate-voucher';
export { submitSupplierPrice } from './callable/submit-price';
export { approveSupplierPrice } from './callable/approve-price';
export { logMaterialEvent } from './callable/log-material-event';
