// Creates the students' dashboard
import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApplicationsService } from '../services/applications.service';
import { ListsService } from '../services/lists.service';
import { CourseOption, InitialApplication } from '../models/application.model';

// Local models for the component
interface UniversityOption {
  _id: string;
  name: string;
}

interface ProfessorOption {
  _id: string;
  fullName: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit {
  // Services injected
  private readonly formBuilder = inject(FormBuilder);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly listsService = inject(ListsService);

  // Arrays of data for the selection lists
  universities: UniversityOption[] = [];
  professors: ProfessorOption[] = [];
  homeCourses: CourseOption[] = [];
  hostCourses: CourseOption[] = [];

  // Files management
  learningAgreementFile: File | null = null;
  newLearningAgreementFile: File | null = null;
  transcriptFile: File | null = null;

  // Applications status
  applicationExists = false;
  applicationStatus: string | null = null;

  // Form of the initial application
  readonly initialApplicationForm = this.formBuilder.group({
    academicYear: ['', Validators.required],
    hostUniversity: ['', Validators.required],
    duration: ['', Validators.required],
    referentProfessor: ['', Validators.required],
    // array of the courses selected by the student
    homeCourses: this.formBuilder.array(
      [
        this.createCourseControl(),
        this.createCourseControl(),
        this.createCourseControl(),
      ],
      Validators.required,
    ),
    hostCourses: this.formBuilder.array(
      [
        this.createCourseControl(),
        this.createCourseControl(),
        this.createCourseControl(),
      ],
      Validators.required,
    ),
  });

  // Form of the mobility period
  readonly mobilityPeriodForm = this.formBuilder.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  // Form of the mapping proposal
  readonly mappingProposalForm = this.formBuilder.group({
    homeCourses: this.formBuilder.array(
      [
        this.createCourseControl(),
        this.createCourseControl(),
        this.createCourseControl(),
      ],
      Validators.required,
    ),
    hostCourses: this.formBuilder.array(
      [
        this.createCourseControl(),
        this.createCourseControl(),
        this.createCourseControl(),
      ],
      Validators.required,
    ),
  });

  // Method ngOnInit, called when the component is initialized
  ngOnInit(): void {
    this.loadLists();
    this.loadMyApplication();
  }

  get initialHomeCourses(): FormArray {
    return this.initialApplicationForm.controls.homeCourses;
  }

  get initialHostCourses(): FormArray {
    return this.initialApplicationForm.controls.hostCourses;
  }

  get proposedHomeCourses(): FormArray {
    return this.mappingProposalForm.controls.homeCourses;
  }

  get proposedHostCourses(): FormArray {
    return this.mappingProposalForm.controls.hostCourses;
  }

  private createCourseControl() {
    return this.formBuilder.control('', Validators.required);
  }

  // Private method to load all the data necessary for the selection lists and the student's application
  private loadLists(): void {
    this.listsService.getUniversities().subscribe({
      // universities
      next: (universities) => {
        this.universities = universities as UniversityOption[];
      },
      error: (error) => {
        console.error('Errore nel caricamento delle università', error);
      },
    });

    this.listsService.getProfessors().subscribe({
      // professors
      next: (professors) => {
        this.professors = professors as ProfessorOption[];
      },
      error: (error) => {
        console.error('Errore nel caricamento dei professori', error);
      },
    });

    this.listsService.getHomeCourses().subscribe({
      // home courses
      next: (courses) => {
        this.homeCourses = courses;
      },
      error: (error) => {
        console.error('Errore nel caricamento dei corsi home', error);
      },
    });

    this.listsService.getHostCourses().subscribe({
      // host courses
      next: (courses) => {
        this.hostCourses = courses;
      },
      error: (error) => {
        console.error('Errore nel caricamento dei corsi host', error);
      },
    });
  }

  // Private method to load the student's application, if it exists
  private loadMyApplication(): void {
    this.applicationsService.getMyApplication().subscribe({
      next: (application: any) => {
        this.applicationExists = true;
        this.applicationStatus = application.status;

        // updates some values of the form without creating a new one
        this.mobilityPeriodForm.patchValue({
          startDate: this.toDateInputValue(application.startDate),
          endDate: this.toDateInputValue(application.endDate),
        });
      },
      error: (error) => {
        if (error.status !== 404) {
          console.error('Errore nel caricamento della candidatura', error);
        }
      },
    });
  }

  // private method to convert a date
  private toDateInputValue(date: string | Date | undefined): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().slice(0, 10);
  }
}
