"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Students = exports.ErasmusDuration = void 0;
// Information about the Erasmus students
const mongoose_1 = __importStar(require("mongoose"));
// Definition of the Erasmus duration
var ErasmusDuration;
(function (ErasmusDuration) {
    ErasmusDuration["FIRST_SEMESTER"] = "Primo Semestre";
    ErasmusDuration["SECOND_SEMESTER"] = "Secondo Semestre";
    ErasmusDuration["FULL_YEAR"] = "Un Anno";
})(ErasmusDuration || (exports.ErasmusDuration = ErasmusDuration = {}));
// Mongoose schema with the realtionships
const studentSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true },
    academicYear: { type: String, required: true },
    hostUniversity: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "HostUniversities",
        required: true,
    },
    duration: {
        type: String,
        enum: Object.values(ErasmusDuration),
        required: true,
    },
    // Relationship with the referent professor
    referentProfessor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Professors",
        required: true,
    },
    // Relationship with the Ca' Foscari's exams
    homeCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" }],
    // Relationship with the foreign university's exams
    hostCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" }],
});
exports.Students = mongoose_1.default.model("Students", studentSchema);
