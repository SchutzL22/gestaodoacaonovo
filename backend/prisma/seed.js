"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seed_js_1 = require("../src/infrastructure/database/seed.js");
(0, seed_js_1.seed)()
    .then(() => {
    process.exit(0);
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
