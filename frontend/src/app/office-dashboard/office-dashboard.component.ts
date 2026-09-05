import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OfficeService } from '../services/office.service';

@Component({
  selector: 'app-office-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './office-dashboard.component.html',
  styleUrl: './office-dashboard.component.css',
})
export class OfficeDashboardComponent implements OnInit {
  private readonly officeService = inject(OfficeService);

  applications: any[] = [];
  comment = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadApplications();
  }

  // Applications that are awaiting learning agreement approval
  get preDepartureApplications(): any[] {
    return this.applications.filter(
      (application) =>
        application.status === 'awaiting_learning_agreement_approval',
    );
  }

  // Applications that are awaiting final review
  get finalReviewApplications(): any[] {
    return this.applications.filter(
      (application) =>
        application.status === 'waiting_for_exam_score_approval' &&
        application.transcriptApproved === true &&
        application.passedHostCourses?.length > 0 &&
        application.passedHostCourses.every(
          (exam: any) => exam.status === 'approved',
        ),
    );
  }

  // Load all applications from the server
  loadApplications(): void {
    this.officeService.getApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.errorMessage = '';
      },
      error: () => {
        this.errorMessage = 'Failed to load applications';
      },
    });
  }

  // Complete the pre-departure process for an application
  completePreDeparture(applicationId: string): void {
    this.officeService
      .completePreDeparture(applicationId, this.comment.trim())
      .subscribe({
        next: () => {
          this.comment = '';
          this.loadApplications();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ?? 'Failed to complete pre-departure';
        },
      });
  }

  // Close an application
  closeApplication(applicationId: string): void {
    this.officeService
      .closeApplication(applicationId, this.comment.trim())
      .subscribe({
        next: () => {
          this.comment = '';
          this.loadApplications();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ?? 'Failed to close application';
        },
      });
  }

  learningAgreementUrl(applicationId: string): string {
    return this.officeService.learningAgreementUrl(applicationId);
  }

  transcriptUrl(applicationId: string): string {
    return this.officeService.transcriptUrl(applicationId);
  }

  courseLabel(course: any): string {
    if (typeof course === 'string') {
      return course;
    }

    return `${course.code} - ${course.name}`;
  }

  examCourseId(exam: any): string {
    return typeof exam.course === 'string' ? exam.course : exam.course._id;
  }
}
