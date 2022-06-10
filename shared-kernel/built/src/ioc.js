"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var inversify_1 = require("inversify");
var identifiers_1 = require("@/constants/identifiers");
var KillSwitch_1 = require("@/KillSwitch");
var baseContainer = new inversify_1.Container();
baseContainer.bind(identifiers_1.default.KillSwitch).toConstantValue(KillSwitch_1.default);
exports.default = baseContainer;
