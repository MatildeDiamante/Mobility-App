// Data types for the frontend application form
export interface CourseMapping {
  homeCourseId: string;
  hostCourseId: string;
}

//Course shown in the selection list
export interface CourseOption {
  _id: string;
  code: string;
  name: string;
  credits: number;
}

// Initial application from the student
export interface InitialApplication {
  academicYear: string;
  hostUniversity: string;
  duration: string;
  mobilityStartDate: string;
  mobilityEndDate: string;
  referentProfessor: string;
  homeCourses: string[];
  hostCourses: string[];
}
