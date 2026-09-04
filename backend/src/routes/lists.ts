// Routes for getting lists of data (universities, professors, courses)
import { Router } from "express";
import { HostUniversities } from "../../mongodbModels/universities";
import { Professors } from "../../mongodbModels/professors";
import { Courses, CourseType } from "../../mongodbModels/exams";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/lists/universities
// Get all host universities
router.get("/universities", authenticate, async (_request, response) => {
  try {
    const universities = await HostUniversities.find().sort({ name: 1 });
    response.json(universities);
  } catch (error) {
    response
      .status(500)
      .json({ message: "Failed to fetch universities", error });
  }
});

// GET /api/lists/professors
// Get all referent professors
router.get("/professors", authenticate, async (_request, response) => {
  try {
    // Get only professors who are marked as referents
    const professors = await Professors.find({ isReferent: true }).sort({
      fullName: 1,
    });
    response.json(professors);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch professors", error });
  }
});

// GET /api/lists/courses?type=home
// GET /api/lists/courses?type=host
// Get courses by type (home = Ca' Foscari, host = foreign university)
router.get("/courses", authenticate, async (request, response) => {
  try {
    const { type, hostUniversity } = request.query;

    let query: any = {};

    // Filter by course type if provided
    if (type === "home") {
      query.type = CourseType.HOME;
    } else if (type === "host") {
      query.type = CourseType.HOST;
    } else if (type) {
      // If type is provided but not valid, return error
      response.status(400).json({
        message: "Type must be 'home' or 'host'",
      });
      return;
    }

    if (type === "host" && hostUniversity) {
      query.hostUniversity = hostUniversity;
    }

    const courses = await Courses.find(query).populate("hostUniversity").sort({
      name: 1,
    });
    response.json(courses);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch courses", error });
  }
});

export default router;
