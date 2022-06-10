"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config = {
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: [
        "./src/**/*.{ts,js}",
        "!**/src/**/*.t.{ts}",
        "!**/node_modules/**",
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: -10,
        }
    }
};
exports.default = config;
