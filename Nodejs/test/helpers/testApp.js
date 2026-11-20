// Shared app instance for route tests. Mocks side-effecting modules
// before requiring src/index.js:
//  - fileSessionStore: would otherwise read/write the real data/session-store.json
//  - reminderScheduler, dashboardNoteScheduler: self-register a node-cron job
//    as a require() side effect
// See their __mocks__ next to the real modules in server_utilities/.
jest.mock('../../server_utilities/fileSessionStore');
jest.mock('../../server_utilities/reminderScheduler');
jest.mock('../../server_utilities/dashboardNoteScheduler');

const app = require('../../src/index.js');

module.exports = app;
