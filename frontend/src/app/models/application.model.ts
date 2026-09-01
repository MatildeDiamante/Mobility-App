// Data types for the frontend application form 
export interface CourseMapping {
  hostCourseCode: string;
  hostCourseName: string;
  hostCourseCredits: number;
  homeCourseCode: string;
  homeCourseName: string;
  homeCourseCredits: number;
}

// Initial application from the student
export interface InitialApplication {
  firstName: string;
  lastName: string;
  academicYear: string;
  hostUniversity: string;
  mobilityStartDate: string;
  mobilityEndDate: string;
  referentProfessor: string;
  courseMappings: CourseMapping[]; // corresponds to the "courseMappings" field in the form
}
