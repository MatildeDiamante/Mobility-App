import bcrypt from "bcryptjs";
import { Professors } from "../mongodbModels/professors";
import { Courses, CourseType } from "../mongodbModels/exams";
import { Students, ErasmusDuration } from "../mongodbModels/students";
import { HostUniversities } from "../mongodbModels/universities";
import { Users } from "../mongodbModels/users";
import { UserRole } from "../mongodbModels/userRole";

export const seedDatabase = async () => {
  const count = await Students.countDocuments();

  if (count === 0) {
    console.log("Database empty, loading seeding of test data...");

    // Add the professors information
    const profBergamasco = await Professors.create({
      fullName: "Prof. Filippo Bergamasco",
      isReferent: true,
    });
    const profPittarello = await Professors.create({
      fullName: "Prof. Fabio Pittarello",
      isReferent: true,
    });
    const profMelonio = await Professors.create({
      fullName: "Prof.ssa Alessandra Melonio",
      isReferent: true,
    });
    const profLuccio = await Professors.create({
      fullName: "Prof.ssa Flaminia Luccio",
      isReferent: true,
    });

    // Add the host universities information
    const uniMunich = await HostUniversities.create({
      name: "Technical University of Munich (TUM)",
      country: "Germany",
      city: "Monaco",
    });
    const uniMadrid = await HostUniversities.create({
      name: "Universidad Politécnica de Madrid",
      country: "Spain",
      city: "Madrid",
    });
    const uniBelgium = await HostUniversities.create({
      name: "KU Leuven",
      country: "Belgium",
      city: "Leuven",
    });

    // Add courses information, both for the Ca' Foscari and
    // the host universities
    const ingSoftware = await Courses.create({
      code: "INFO‑01/A",
      name: "Ingegneria del Software",
      credits: 6,
      type: CourseType.HOME,
    });
    const basiDati = await Courses.create({
      code: "INFO‑01/A",
      name: "Basi di Dati",
      credits: 9,
      type: CourseType.HOME,
    });
    const reteCalcolatori = await Courses.create({
      code: "IINF‑05/A",
      name: "Reti di Calcolatori",
      credits: 6,
      type: CourseType.HOME,
    });
    const progOggetti = await Courses.create({
      code: "INFO‑01/A",
      name: "Programmazione a Oggetti",
      credits: 9,
      type: CourseType.HOME,
    });
    const tecAppWeb = await Courses.create({
      code: "IINF‑05/A",
      name: "Tecnologie e applicazioni web",
      credits: 6,
      type: CourseType.HOME,
    });
    const artIntelligence = await Courses.create({
      code: "IINF‑05/A",
      name: "Artificial intelligence",
      credits: 6,
      type: CourseType.HOME,
    });

    const softArch = await Courses.create({
      code: "INFO‑01/A",
      name: "Software Architecture",
      credits: 6,
      type: CourseType.HOST,
      hostUniversity: uniMunich._id,
    });
    const dbSystems = await Courses.create({
      code: "INF/01",
      name: "Advanced Database Systems",
      credits: 9,
      type: CourseType.HOST,
      hostUniversity: uniMunich._id,
    });
    const computerNets = await Courses.create({
      code: "IINF‑05/A",
      name: "Computer Networking",
      credits: 6,
      type: CourseType.HOST,
      hostUniversity: uniMunich._id,
    });
    const aInt = await Courses.create({
      code: "IINF‑05/A",
      name: "Artificial intelligence",
      credits: 6,
      type: CourseType.HOST,
      hostUniversity: uniMadrid._id,
    });
    const webDevelopment = await Courses.create({
      code: "IINF‑05/A",
      name: "Web Development",
      credits: 6,
      type: CourseType.HOST,
      hostUniversity: uniMadrid._id,
    });
    const distSystems = await Courses.create({
      code: "INF/01",
      name: "Distributed systems",
      credits: 6,
      type: CourseType.HOST,
      hostUniversity: uniMadrid._id,
    });
    const opSystems = await Courses.create({
      code: "INFO‑01/A",
      name: "Operative Systems",
      credits: 12,
      type: CourseType.HOST,
      hostUniversity: uniBelgium._id,
    });
    const advDistAlgorithms = await Courses.create({
      code: "INFO‑01/A",
      name: "Advanced and Distributed Algorithms",
      credits: 6,
      type: CourseType.HOST,
      hostUniversity: uniBelgium._id,
    });
    const socNetAnalysis = await Courses.create({
      code: "INFO‑01/A",
      name: "Social Network Analysis",
      credits: 6,
      type: CourseType.HOST,
      hostUniversity: uniBelgium._id,
    });

    // Add the students linked to the objects created
    await Students.create([
      {
        fullName: "Matilde Moretti",
        academicYear: "2025/2026",
        hostUniversity: uniMadrid._id,
        duration: ErasmusDuration.FIRST_SEMESTER,
        referentProfessor: profMelonio._id,
        homeCourses: [tecAppWeb._id, ingSoftware._id, artIntelligence._id],
        hostCourses: [distSystems._id, webDevelopment._id, aInt._id],
      },
      {
        fullName: "Cipriano Mazzagreco",
        academicYear: "2025/2026",
        hostUniversity: uniBelgium._id,
        duration: ErasmusDuration.FULL_YEAR,
        referentProfessor: profLuccio._id,
        homeCourses: [progOggetti._id, reteCalcolatori._id, basiDati._id],
        hostCourses: [opSystems._id, advDistAlgorithms._id, socNetAnalysis._id],
      },
      {
        fullName: "Anna Fontanini",
        academicYear: "2025/2026",
        hostUniversity: uniMunich._id,
        duration: ErasmusDuration.SECOND_SEMESTER,
        referentProfessor: profBergamasco._id,
        homeCourses: [progOggetti._id, ingSoftware._id, artIntelligence._id],
        hostCourses: [softArch._id, computerNets._id, dbSystems._id],
      },
      {
        fullName: "Marco Neri",
        academicYear: "2025/2026",
        hostUniversity: uniMunich._id,
        duration: ErasmusDuration.FULL_YEAR,
        referentProfessor: profPittarello._id,
        homeCourses: [tecAppWeb._id, ingSoftware._id, reteCalcolatori._id],
        hostCourses: [softArch._id, computerNets._id, dbSystems._id],
      },
    ]);
  }

  // Seed student and professor user accounts
  const matilde = await Students.findOne({
    fullName: "Matilde Moretti",
  });

  const professorMelonio = await Professors.findOne({
    fullName: "Prof.ssa Alessandra Melonio",
  });

  if (!matilde || !professorMelonio) {
    throw new Error(
      "Student or professor profile  is missing from the seed data",
    );
  }

  const studentPasswordHash = await bcrypt.hash("Password123!", 12);

  // Creates the accounts of students, professors, and office staff
  await Users.updateOne(
    { email: "907785@stud.unive.it" },
    {
      $set: {
        email: "907785@stud.unive.it",
        passwordHash: studentPasswordHash,
        role: UserRole.STUDENT,
        student: matilde!._id,
      },
    },
    { upsert: true },
  );

  const professorPasswordHash = await bcrypt.hash("Password123!", 12);

  await Users.updateOne(
    { email: "melonio@unive.it" },
    {
      $set: {
        email: "melonio@unive.it",
        passwordHash: professorPasswordHash,
        role: UserRole.PROFESSOR,
        professor: professorMelonio._id,
      },
    },
    { upsert: true },
  );

  const officePasswordHash = await bcrypt.hash("Password123!", 12);

  await Users.updateOne(
    { email: "office@unive.it" },
    {
      $set: {
        email: "office@unive.it",
        passwordHash: officePasswordHash,
        role: UserRole.OFFICE_STAFF,
      },
    },
    { upsert: true },
  );
};
