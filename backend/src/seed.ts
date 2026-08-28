import { Professors } from "../mongodbModels/professors";
import { Courses } from "../mongodbModels/exams";
import { Students, ErasmusDuration } from "../mongodbModels/students";
import { HostUniversities } from "../mongodbModels/universities";

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
    });
    const uniMadrid = await HostUniversities.create({
      name: "Universidad Politécnica de Madrid",
    });
    const uniBelgium = await HostUniversities.create({
      name: "KU Leuven",
    });

    // Add courses information, both for the Ca' Foscari and
    // the host universities
    const ingSoftware = await Courses.create({
      code: "INFO‑01/A",
      name: "Ingegneria del Software",
      credits: 6,
    });
    const basiDati = await Courses.create({
      code: "INFO‑01/A",
      name: "Basi di Dati",
      credits: 9,
    });
    const reteCalcolatori = await Courses.create({
      code: "IINF‑05/A",
      name: "Reti di Calcolatori",
      credits: 6,
    });
    const progOggetti = await Courses.create({
      code: "INFO‑01/A",
      nome: "Programmazione a Oggetti",
      credits: 9,
    });
    const tecAppWeb = await Courses.create({
      code: "IINF‑05/A",
      name: "Tecnologie e applicazioni web",
      credits: 6,
    });
    const artIntelligence = await Courses.create({
      code: "IINF‑05/A",
      name: "Artificial intelligence",
      credits: 6,
    });

    const softArch = await Courses.create({
      code: "INFO‑01/A",
      name: "Software Architecture",
      credits: 6,
    });
    const dbSystems = await Courses.create({
      code: "INF/01",
      name: "Advanced Database Systems",
      credits: 9,
    });
    const computerNets = await Courses.create({
      code: "IINF‑05/A",
      name: "Computer Networking",
      credits: 6,
    });
    const aInt = await Courses.create({
      code: "IINF‑05/A",
      name: "Artificial intelligence",
      credits: 6,
    });
    const webDevelopment = await Courses.create({
      code: "IINF‑05/A",
      name: "Web Development",
      credits: 6,
    });
    const distSystems = await Courses.create({
      code: "INF/01",
      name: "Distributed systems",
      credits: 6,
    });

    // Add the students linked to the objects created
    await Students.create([
      {
        fullName: "Matilde Moretti",
        academicYear: "2025/2026",
        hostUniversity: uniMadrid._id,
        duration: ErasmusDuration.FIRST_SEMESTER,
        referentProfessor: profMelonio._id,
        univeCourses: [tecAppWeb._id, ingSoftware._id, artIntelligence._id],
        hostCourses: [webDevelopment._id, aInt._id, softArch._id],
      },
      {
        fullName: "Cipriano Mazzagreco",
        academicYear: "2025/2026",
        hostUniversity: uniBelgium._id,
        duration: ErasmusDuration.FULL_YEAR,
        referentProfessor: profLuccio._id,
        univeCourses: [progOggetti._id, reteCalcolatori._id, basiDati._id],
        hostCourses: [distSystems._id, computerNets._id, dbSystems._id],
      },
      {
        fullName: "Anna Fontanini",
        academicYear: "2025/2026",
        hostUniversity: uniMunich._id,
        duration: ErasmusDuration.SECOND_SEMESTER,
        referentProfessor: profBergamasco._id,
        univeCourses: [progOggetti._id, ingSoftware._id, artIntelligence._id],
        hostCourses: [webDevelopment._id, computerNets._id, dbSystems._id],
      },
      {
        fullName: "Marco Neri",
        academicYear: "2025/2026",
        hostUniversity: uniMunich._id,
        duration: ErasmusDuration.FULL_YEAR,
        referentProfessor: profPittarello._id,
        univeCourses: [tecAppWeb._id, ingSoftware._id, reteCalcolatori._id],
        hostCourses: [computerNets._id, aInt._id, distSystems._id],
      },
    ]);
  }
};
