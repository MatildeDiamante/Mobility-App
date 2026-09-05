"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const professors_1 = require("../mongodbModels/professors");
const exams_1 = require("../mongodbModels/exams");
const students_1 = require("../mongodbModels/students");
const universities_1 = require("../mongodbModels/universities");
const users_1 = require("../mongodbModels/users");
const userRole_1 = require("../mongodbModels/userRole");
const seedDatabase = async () => {
    const count = await students_1.Students.countDocuments();
    if (count === 0) {
        console.log("Database empty, loading seeding of test data...");
        // Add the professors information
        const profBergamasco = await professors_1.Professors.create({
            fullName: "Prof. Filippo Bergamasco",
            isReferent: true,
        });
        const profPittarello = await professors_1.Professors.create({
            fullName: "Prof. Fabio Pittarello",
            isReferent: true,
        });
        const profMelonio = await professors_1.Professors.create({
            fullName: "Prof.ssa Alessandra Melonio",
            isReferent: true,
        });
        const profLuccio = await professors_1.Professors.create({
            fullName: "Prof.ssa Flaminia Luccio",
            isReferent: true,
        });
        // Add the host universities information
        const uniMunich = await universities_1.HostUniversities.create({
            name: "Technical University of Munich (TUM)",
            country: "Germany",
            city: "Monaco",
        });
        const uniMadrid = await universities_1.HostUniversities.create({
            name: "Universidad Politécnica de Madrid",
            country: "Spain",
            city: "Madrid",
        });
        const uniBelgium = await universities_1.HostUniversities.create({
            name: "KU Leuven",
            country: "Belgium",
            city: "Leuven",
        });
        // Add courses information, both for the Ca' Foscari and
        // the host universities
        const ingSoftware = await exams_1.Courses.create({
            code: "INFO‑01/A",
            name: "Ingegneria del Software",
            credits: 6,
            type: exams_1.CourseType.HOME,
        });
        const basiDati = await exams_1.Courses.create({
            code: "INFO‑01/A",
            name: "Basi di Dati",
            credits: 9,
            type: exams_1.CourseType.HOME,
        });
        const reteCalcolatori = await exams_1.Courses.create({
            code: "IINF‑05/A",
            name: "Reti di Calcolatori",
            credits: 6,
            type: exams_1.CourseType.HOME,
        });
        const progOggetti = await exams_1.Courses.create({
            code: "INFO‑01/A",
            name: "Programmazione a Oggetti",
            credits: 9,
            type: exams_1.CourseType.HOME,
        });
        const tecAppWeb = await exams_1.Courses.create({
            code: "IINF‑05/A",
            name: "Tecnologie e applicazioni web",
            credits: 6,
            type: exams_1.CourseType.HOME,
        });
        const artIntelligence = await exams_1.Courses.create({
            code: "IINF‑05/A",
            name: "Artificial intelligence",
            credits: 6,
            type: exams_1.CourseType.HOME,
        });
        const softArch = await exams_1.Courses.create({
            code: "INFO‑01/A",
            name: "Software Architecture",
            credits: 6,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniMunich._id,
        });
        const dbSystems = await exams_1.Courses.create({
            code: "INF/01",
            name: "Advanced Database Systems",
            credits: 9,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniMunich._id,
        });
        const computerNets = await exams_1.Courses.create({
            code: "IINF‑05/A",
            name: "Computer Networking",
            credits: 6,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniMunich._id,
        });
        const aInt = await exams_1.Courses.create({
            code: "IINF‑05/A",
            name: "Artificial intelligence",
            credits: 6,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniMadrid._id,
        });
        const webDevelopment = await exams_1.Courses.create({
            code: "IINF‑05/A",
            name: "Web Development",
            credits: 6,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniMadrid._id,
        });
        const distSystems = await exams_1.Courses.create({
            code: "INF/01",
            name: "Distributed systems",
            credits: 6,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniMadrid._id,
        });
        const opSystems = await exams_1.Courses.create({
            code: "INFO‑01/A",
            name: "Operative Systems",
            credits: 12,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniBelgium._id,
        });
        const advDistAlgorithms = await exams_1.Courses.create({
            code: "INFO‑01/A",
            name: "Advanced and Distributed Algorithms",
            credits: 6,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniBelgium._id,
        });
        const socNetAnalysis = await exams_1.Courses.create({
            code: "INFO‑01/A",
            name: "Social Network Analysis",
            credits: 6,
            type: exams_1.CourseType.HOST,
            hostUniversity: uniBelgium._id,
        });
        // Add the students linked to the objects created
        await students_1.Students.create([
            {
                fullName: "Matilde Moretti",
                academicYear: "2025/2026",
                hostUniversity: uniMadrid._id,
                duration: students_1.ErasmusDuration.FIRST_SEMESTER,
                referentProfessor: profMelonio._id,
                homeCourses: [tecAppWeb._id, ingSoftware._id, artIntelligence._id],
                hostCourses: [distSystems._id, webDevelopment._id, aInt._id],
            },
            {
                fullName: "Cipriano Mazzagreco",
                academicYear: "2025/2026",
                hostUniversity: uniBelgium._id,
                duration: students_1.ErasmusDuration.FULL_YEAR,
                referentProfessor: profLuccio._id,
                homeCourses: [progOggetti._id, reteCalcolatori._id, basiDati._id],
                hostCourses: [opSystems._id, advDistAlgorithms._id, socNetAnalysis._id],
            },
            {
                fullName: "Anna Fontanini",
                academicYear: "2025/2026",
                hostUniversity: uniMunich._id,
                duration: students_1.ErasmusDuration.SECOND_SEMESTER,
                referentProfessor: profBergamasco._id,
                homeCourses: [progOggetti._id, ingSoftware._id, artIntelligence._id],
                hostCourses: [softArch._id, computerNets._id, dbSystems._id],
            },
            {
                fullName: "Marco Neri",
                academicYear: "2025/2026",
                hostUniversity: uniMunich._id,
                duration: students_1.ErasmusDuration.FULL_YEAR,
                referentProfessor: profPittarello._id,
                homeCourses: [tecAppWeb._id, ingSoftware._id, reteCalcolatori._id],
                hostCourses: [softArch._id, computerNets._id, dbSystems._id],
            },
        ]);
    }
    // Seed student and professor user accounts
    const matilde = await students_1.Students.findOne({
        fullName: "Matilde Moretti",
    });
    const professorMelonio = await professors_1.Professors.findOne({
        fullName: "Prof.ssa Alessandra Melonio",
    });
    if (!matilde || !professorMelonio) {
        throw new Error("Student or professor profile  is missing from the seed data");
    }
    const studentPasswordHash = await bcryptjs_1.default.hash("Password123!", 12);
    // Creates the accounts of students, professors, and office staff
    await users_1.Users.updateOne({ email: "907785@stud.unive.it" }, {
        $set: {
            email: "907785@stud.unive.it",
            passwordHash: studentPasswordHash,
            role: userRole_1.UserRole.STUDENT,
            student: matilde._id,
        },
    }, { upsert: true });
    const professorPasswordHash = await bcryptjs_1.default.hash("Password123!", 12);
    await users_1.Users.updateOne({ email: "melonio@unive.it" }, {
        $set: {
            email: "melonio@unive.it",
            passwordHash: professorPasswordHash,
            role: userRole_1.UserRole.PROFESSOR,
            professor: professorMelonio._id,
        },
    }, { upsert: true });
    const officePasswordHash = await bcryptjs_1.default.hash("Password123!", 12);
    await users_1.Users.updateOne({ email: "office@unive.it" }, {
        $set: {
            email: "office@unive.it",
            passwordHash: officePasswordHash,
            role: userRole_1.UserRole.OFFICE_STAFF,
        },
    }, { upsert: true });
};
exports.seedDatabase = seedDatabase;
