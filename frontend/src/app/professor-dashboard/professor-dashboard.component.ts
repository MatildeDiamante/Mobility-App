// Component for the professor dashboard, managing the application's review and decision processes
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfessorService } from '../services/professor.service';

interface ExamReview {
  approved: boolean;
  comment: string;
}

@Component({
  selector: 'app-professor-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './professor-dashboard.component.html',
  styleUrl: './professor-dashboard.component.css',
})
export class ProfessorDashboardComponent implements OnInit {
  private readonly professorService = inject(ProfessorService);

  applications: any[] = [];
  selectedApplication: any | null = null;

  rejectionReason = '';
  transcriptComment = '';
  examReviews: Record<string, ExamReview> = {};

  ngOnInit(): void {
    this.loadApplications();
  }

  // Load all professor applications from the server
  loadApplications(): void {
    this.professorService.getApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.initializeExamReviews();

        if (
          this.selectedApplication &&
          !applications.some(
            (application) => application._id === this.selectedApplication._id,
          )
        ) {
          this.selectedApplication = null;
        }
      },
      error: (error) => {
        console.error('Unable to load professor applications', error);
      },
    });
  }

  // Select a specific application for review
  selectApplication(application: any): void {
    this.selectedApplication = application;
    this.rejectionReason = '';
    this.transcriptComment = '';
  }

  // Get all initial applications
  get initialApplications(): any[] {
    return this.applications.filter(
      (application) => application.status === 'created',
    );
  }

  decide(
    applicationId: string,
    decision: 'approve' | 'reject' | 'approve_changes' | 'reject_changes',
  ): void {
    const isRejection = decision === 'reject' || decision === 'reject_changes';

    if (isRejection && !this.rejectionReason.trimEnd()) {
      return;
    }

    this.professorService
      .decide(applicationId, decision, this.rejectionReason.trim())
      .subscribe({
        next: () => {
          this.rejectionReason = '';
          this.loadApplications();
        },
        error: (error) => {
          console.error('Unable to submit the professor decision', error);
        },
      });
  }

  // Review the transcript of a specific application
  reviewTranscript(applicationId: string, approved: boolean): void {
    if (!approved && !this.transcriptComment.trim()) {
      return;
    }

    this.professorService
      .reviewTranscript(applicationId, approved, this.transcriptComment.trim())
      .subscribe({
        next: () => {
          this.transcriptComment = '';
          this.loadApplications();
        },
        error: (error) => {
          console.error('Unable to review the transcript', error);
        },
      });
  }

  // Review the exams of a specific application
  reviewExams(application: any): void {
    const reviews = (application.passedHostCourese ?? []).map((exam: any) => {
      const courseId = this.courseId(exam.course);
      const review = this.examReviews[courseId];

      return {
        courseId,
        approved: review?.approved ?? false,
        comment: review?.comment ?? '',
      };
    });

    this.professorService.reviewExams(application._id, reviews).subscribe({
      next: () => {
        this.loadApplications();
      },
      error: (error) => {
        console.error('Unable to review the exams', error);
      },
    });
  }

  learningAgreementUrl(applicationId: string): string {
    return this.professorService.learningAgreementUrl(applicationId);
  }

  proposedLearningAgreementUrl(applicationId: string): string {
    return this.professorService.proposedLearningAgreementUrl(applicationId);
  }

  transcriptUrl(applicationId: string): string {
    return this.professorService.transcriptUrl(applicationId);
  }

  courseId(course: any): string {
    return typeof course === 'string' ? course : course._id;
  }

  // Get the label for a course
  courseLabel(course: any): string {
    if (typeof course === 'string') {
      return course;
    }
    return `${course.code} - ${course.name}`;
  }

  // Initialize the exam reviews for all applications
  private initializeExamReviews(): void {
    for (const application of this.applications) {
      for (const exam of application.passedHostCourese ?? []) {
        const courseId = this.courseId(exam.course);

        if (!this.examReviews[courseId]) {
          this.examReviews[courseId] = {
            approved: exam.status === 'approved',
            comment: exam.comment ?? '',
          };
        }
      }
    }
  }
}
