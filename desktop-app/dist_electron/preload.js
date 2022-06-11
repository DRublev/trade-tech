/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/ipcEvents.ts":
/*!**************************!*\
  !*** ./src/ipcEvents.ts ***!
  \**************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony default export */ __webpack_exports__[\"default\"] = ({\n    SAVE_SANDBOX_TOKEN: 'SAVE_SANDBOX_TOKEN',\n});\n\n\n//# sourceURL=webpack:///./src/ipcEvents.ts?");

/***/ }),

/***/ "./src/preload.ts":
/*!************************!*\
  !*** ./src/preload.ts ***!
  \************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _ipcEvents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ipcEvents */ \"./src/ipcEvents.ts\");\nvar require;\n\n/*\n  Experimental security feature:\n        We set the global \"require\" variable to null after importing what we need.\n        Given that there is an exploit within the preload context, they lost require atleast.\n        Garbage collection should pick it up.\n*/\n// @ts-ignore\nrequire = null;\nconst validChannels = Object.values(_ipcEvents__WEBPACK_IMPORTED_MODULE_1__[\"default\"]);\nclass SafeIpcRenderer {\n    constructor(events) {\n        const protect = (fn) => {\n            return (channel, ...args) => {\n                if (!events.includes(channel)) {\n                    throw new Error(`Blocked access to unknown channel ${channel} from the renderer. \n                          Add channel to whitelist in preload.js in case it is legitimate.`);\n                }\n                return fn.apply(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"], [channel].concat(args));\n            };\n        };\n        this.on = protect(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"].on);\n        this.once = protect(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"].once);\n        this.removeListener = protect(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"].removeListener);\n        this.removeAllListeners = protect(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"].removeAllListeners);\n        this.send = protect(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"].send);\n        this.sendSync = protect(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"].sendSync);\n        this.sendToHost = protect(electron__WEBPACK_IMPORTED_MODULE_0__[\"ipcRenderer\"].sendToHost);\n    }\n}\nelectron__WEBPACK_IMPORTED_MODULE_0__[\"contextBridge\"].exposeInMainWorld('ipc', new SafeIpcRenderer(validChannels));\n// contextBridge.exposeInMainWorld(\n//   'ipc', {\n//     send: (channel: any, data: any) => {\n//       console.log('9 preload', channel);\n//       if (validChannels.includes(channel)) {\n//         ipcRenderer.send(channel, data);\n//       }\n//     },\n//     on: (channel: any, func: any) => {\n//       console.log('14 preload', channel);\n//       if (validChannels.includes(channel)) {\n//         // Strip event as it includes `sender` and is a security risk\n//         ipcRenderer.on(channel, (event, ...args) => func(...args));\n//       }\n//     },\n//   },\n// );\n\n\n//# sourceURL=webpack:///./src/preload.ts?");

/***/ }),

/***/ 0:
/*!******************************!*\
  !*** multi ./src/preload.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(/*! /Users/daniilrublev/Documents/Projects/trade-bot/trade-tech/desktop-app/src/preload.ts */\"./src/preload.ts\");\n\n\n//# sourceURL=webpack:///multi_./src/preload.ts?");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"electron\");\n\n//# sourceURL=webpack:///external_%22electron%22?");

/***/ })

/******/ });