// Service for professor-related API calls
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProfessorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/professor';

  getApplications() {
    return this.http.get<any[]>(`${this.apiUrl}/applications`, {
      withCredentials: true,
    });
  }

  decide(applicationId: string, decision: string, comment = '') {
    return this.http.patch(
      `${this.apiUrl}/applications/${applicationId}/decision`,
      {
        decision,
        comment,
      },
      {
        withCredentials: true,
      },
    );
  }

  reviewTranscript(applicationId: string, approved: boolean, comment = '') {
    return this.http.patch(
      `${this.apiUrl}/applications/${applicationId}/transcript/review`,
      {
        approved,
        comment,
      },
      {
        withCredentials: true,
      },
    );
  }

  reviewExams(
    applicationId: string,
    reviews: { courseId: string; approved: boolean; comment: string }[],
  ) {
    return this.http.patch(
      `${this.apiUrl}/applications/${applicationId}/exams/review`,
      {
        reviews,
      },
      {
        withCredentials: true,
      },
    );
  }

  learningAgreementUrl(applicationId: string): string {
    return `${this.apiUrl}/applications/${applicationId}/learning-agreement`;
  }

  proposedLearningAgreementUrl(applicationId: string): string {
    return `${this.apiUrl}/applications/${applicationId}/proposed-learning-agreement`;
  }

  transcriptUrl(applicationId: string): string {
    return `${this.apiUrl}/applications/${applicationId}/transcript`;
  }
}
