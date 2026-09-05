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
import { startWith } from 'rxjs';

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
  hostCoursesForExams: CourseOption[] = [];

  // Applications status
  applicationExists = false;
  showInitialApplicationForm = false;
  applicationStatus: string | null = null;
  mappingProposalMessage = '';
  mappingProposalError = '';
  mobilityPeriodMessage = '';
  mobilityPeriodError = '';
  transcriptMessage = '';
  transcriptError = '';

  // Application list and the selected application ID
  applications: any[] = [];
  selectedApplicationId: string | null = null;

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

  readonly passedExamsForm = this.formBuilder.group({
    passedHostCourses: this.formBuilder.array<any>([]),
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
    this.initialApplicationForm.controls.hostUniversity.valueChanges
      .pipe(
        startWith(this.initialApplicationForm.controls.hostUniversity.value),
      )
      .subscribe((hostUniversityId) => {
        this.initialHostCourses.reset();

        if (!hostUniversityId) {
          if (!this.applicationExists) {
            this.hostCourses = [];
          }
          return;
        }

        this.loadHostCourses(hostUniversityId);
      });
    this.loadMyApplication();
  }

  private loadHostCourses(hostUniversityId: string): void {
    this.listsService.getHostCourses(hostUniversityId).subscribe({
      next: (courses) => {
        this.hostCourses = courses;
      },
      error: (error) => {
        this.hostCourses = [];
        console.error('Error during the loading of the host courses', error);
      },
    });
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

  get passedHostCourses(): FormArray {
    return this.passedExamsForm.controls.passedHostCourses;
  }

  // Method to exclude already selected courses
  isInitiallySelected(
    courseId: string,
    currentCourseId: string | null,
    courseType: 'home' | 'host',
  ): boolean {
    const courseControls =
      courseType === 'home'
        ? this.initialHomeCourses.controls
        : this.initialHostCourses.controls;

    return courseControls.some(
      (control) =>
        control.value === courseId && control.value !== currentCourseId,
    );
  }

  isProposedSelected(
    courseId: string,
    currentCourseId: string | null,
    courseType: 'home' | 'host',
  ): boolean {
    const courseControls =
      courseType === 'home'
        ? this.proposedHomeCourses.controls
        : this.proposedHostCourses.controls;

    return courseControls.some(
      (control) =>
        control.value === courseId && control.value !== currentCourseId,
    );
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
        console.error('Error during the loading of universities', error);
      },
    });

    this.listsService.getProfessors().subscribe({
      // professors
      next: (professors) => {
        this.professors = professors as ProfessorOption[];
      },
      error: (error) => {
        console.error('Error during the loading of professors', error);
      },
    });

    this.listsService.getHomeCourses().subscribe({
      // home courses
      next: (courses) => {
        this.homeCourses = courses;
      },
      error: (error) => {
        console.error('Error during the loading of home courses', error);
      },
    });
  }

  // Private method to load the student's application, if it exists
  private loadMyApplication(): void {
    this.applicationsService.getMyApplications().subscribe({
      next: (applications: any) => {
        this.applications = applications;

        if (applications.length === 0) {
          this.applicationExists = false;
          return;
        }

        this.applicationExists = true;
        this.selectApplication(applications[0]._id);
      },
      error: (error) => {
        console.error('Error during the loading of the application', error);
      },
    });
  }

  // Method to select an application and load its details
  selectApplication(applicationId: string): void {
    this.applicationsService.getApplication(applicationId).subscribe({
      next: (application: any) => {
        this.selectedApplicationId = application._id;
        this.applicationStatus = application.status;

        const hostUniversityId =
          typeof application.hostUniversity === 'string'
            ? application.hostUniversity
            : application.hostUniversity?._id;

        if (hostUniversityId) {
          this.loadHostCourses(hostUniversityId);
        }

        this.setPassedHostCourses(application.hostCourses ?? []);

        this.mobilityPeriodForm.patchValue({
          startDate: this.toDateInputValue(application.startDate),
          endDate: this.toDateInputValue(application.endDate),
        });
      },
      error: (error) => {
        console.error('Error during the loading of the application', error);
      },
    });
  }

  returnToInitialApplication(): void {
    this.showInitialApplicationForm = true;
  }

  // Methods to select the files
  selectLearningAgreement(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.learningAgreementFile = this.getPdfFile(file, input);
  }

  selectNewLearningAgreement(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.newLearningAgreementFile = this.getPdfFile(file, input);
  }

  selectTranscript(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.transcriptFile = this.getPdfFile(file, input);
  }

  private setPassedHostCourses(courses: CourseOption[]): void {
    this.hostCoursesForExams = courses;
    this.passedHostCourses.clear();

    for (const course of courses) {
      this.passedHostCourses.push(
        this.formBuilder.group({
          course: [course._id, Validators.required],
          grade: ['', Validators.required],
        }),
      );
    }
  }

  courseLabel(course: CourseOption): string {
    return `${course.code} - ${course.name} (${course.credits} ECTS)`;
  }

  // Method to submit the forms
  submitInitialApplication(): void {
    if (this.initialApplicationForm.invalid || !this.learningAgreementFile) {
      this.initialApplicationForm.markAllAsTouched();
      return;
    }

    const formValue = this.initialApplicationForm.getRawValue();
    const application: InitialApplication = {
      academicYear: formValue.academicYear ?? '',
      hostUniversity: formValue.hostUniversity ?? '',
      duration: formValue.duration ?? '',
      referentProfessor: formValue.referentProfessor ?? '',
      homeCourses: this.getCourseIds(
        this.initialApplicationForm.controls.homeCourses,
      ),
      hostCourses: this.getCourseIds(
        this.initialApplicationForm.controls.hostCourses,
      ),
      mobilityStartDate: '',
      mobilityEndDate: '',
    };

    this.applicationsService
      .createInitialApplication(application, this.learningAgreementFile)
      .subscribe({
        next: (createdApplication: any) => {
          this.applicationExists = true;
          this.showInitialApplicationForm = false;
          this.selectedApplicationId = createdApplication._id;
          this.applicationStatus = createdApplication.status ?? 'created';

          this.applications = [createdApplication, ...this.applications]; // the new application is the selected one
        },
        error: (error) => {
          console.error(
            'Error during the submission of the application',
            error,
          );
        },
      });
  }

  // Method to update the mobility period
  updateMobilityPeriod(): void {
    this.mobilityPeriodMessage = '';
    this.mobilityPeriodError = '';

    if (!this.selectedApplicationId || this.mobilityPeriodForm.invalid) {
      this.mobilityPeriodForm.markAllAsTouched();
      this.mobilityPeriodError =
        'Inserisci una data di inizio e una data di fine valide.';
      return;
    }

    const { startDate, endDate } = this.mobilityPeriodForm.getRawValue();

    this.applicationsService
      .updateMobilityPeriod(
        this.selectedApplicationId,
        startDate ?? '',
        endDate ?? '',
      )
      .subscribe({
        next: (application: any) => {
          this.applicationStatus = application.status ?? this.applicationStatus;
          this.mobilityPeriodMessage =
            'Il periodo di mobilità è stato aggiornato correttamente.';
        },
        error: (error) => {
          this.mobilityPeriodError =
            error.error?.message ??
            'Non è stato possibile aggiornare il periodo di mobilità.';
          console.error(
            'There was an error during the update of the mobility period',
            error,
          );
        },
      });
  }

  // Method to complete the mobility
  completeMobility(): void {
    if (!this.selectedApplicationId) {
      return;
    }

    this.applicationsService
      .completeMobility(this.selectedApplicationId)
      .subscribe({
        next: (application: any) => {
          this.applicationStatus = application.status;
        },
        error: (error) => {
          console.error('Error while completing the mobility', error);
        },
      });
  }

  // Method to submit the new mapping proposal
  submitNewMapping(): void {
    this.mappingProposalMessage = '';
    this.mappingProposalError = '';

    if (
      !this.selectedApplicationId ||
      this.mappingProposalForm.invalid ||
      !this.newLearningAgreementFile
    ) {
      this.mappingProposalForm.markAllAsTouched();
      this.mappingProposalError =
        'Completa tutti i corsi e seleziona il nuovo Learning Agreement in PDF.';
      return;
    }

    const homeCourses = this.getCourseIds(
      this.mappingProposalForm.controls.homeCourses,
    );
    const hostCourses = this.getCourseIds(
      this.mappingProposalForm.controls.hostCourses,
    );

    this.applicationsService
      .proposeNewMapping(
        this.selectedApplicationId,
        homeCourses,
        hostCourses,
        this.newLearningAgreementFile,
      )
      .subscribe({
        next: (application: any) => {
          this.applicationStatus = application.status ?? this.applicationStatus;
          this.mappingProposalMessage =
            'La nuova proposta di mapping e il Learning Agreement sono stati inviati al professore referente.';
          this.mappingProposalForm.reset();
          this.newLearningAgreementFile = null;
        },
        error: (error) => {
          this.mappingProposalError =
            error.error?.message ??
            'Non è stato possibile inviare la nuova proposta di mapping.';
          console.error(
            'Error during the submission of the new mapping',
            error,
          );
        },
      });
  }

  // Method to upload the transcript
  uploadTranscript(): void {
    this.transcriptMessage = '';
    this.transcriptError = '';

    if (
      !this.selectedApplicationId ||
      !this.transcriptFile ||
      this.passedExamsForm.invalid
    ) {
      this.passedExamsForm.markAllAsTouched();
      this.transcriptError =
        'Seleziona il Transcript of Records in PDF e inserisci il voto per ogni corso host.';
      return;
    }

    const passedHostCourses = this.passedExamsForm.getRawValue()
      .passedHostCourses as { course: string; grade: string }[];

    this.applicationsService
      .uploadTranscript(
        this.selectedApplicationId,
        this.transcriptFile,
        passedHostCourses,
      )
      .subscribe({
        next: (application: any) => {
          this.applicationStatus = application.status ?? this.applicationStatus;
          this.transcriptMessage =
            'Il Transcript of Records e i voti degli esami sono stati inviati al professore referente.';
          this.transcriptFile = null;
          this.passedExamsForm.reset();
        },
        error: (error) => {
          this.transcriptError =
            error.error?.message ??
            'Non è stato possibile inviare il Transcript of Records.';
          console.error('Error during the upload of the Transcript', error);
        },
      });
  }

  // Private method to get the course IDs from the form array
  private getCourseIds(courseControls: FormArray): string[] {
    return courseControls.controls
      .map((control) => control.value)
      .filter((courseId): courseId is string => Boolean(courseId));
  }

  // Private method to validate the selected file
  private getPdfFile(file: File | null, input: HTMLInputElement): File | null {
    if (!file) {
      return null;
    }

    if (file.type !== 'application/pdf') {
      input.value = '';
      console.error('Only PDF files can be selected');
      return null;
    }

    return file;
  }

  // Private method to convert a date
  private toDateInputValue(date: string | Date | undefined): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().slice(0, 10);
  }
}
