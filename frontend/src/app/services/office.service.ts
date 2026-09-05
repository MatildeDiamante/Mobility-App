// Service for office staff-related API calls
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OfficeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/office';
  private readonly applicationsApiUrl =
    'http://localhost:8080/api/applications';

  getApplications(status?: string) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : '';

    return this.http.get<any[]>(`${this.apiUrl}/applications${suffix}`, {
      withCredentials: true,
    });
  }

  completePreDeparture(applicationId: string, comment = '') {
    return this.http.patch(
      `${this.apiUrl}/applications/${applicationId}/ pre-departure`,
      { comment },
      { withCredentials: true },
    );
  }

  closeApplication(applicationId: string, comment = '') {
    return this.http.patch(
      `${this.apiUrl}/applications/${applicationId}/verify`,
      { comment },
      { withCredentials: true },
    );
  }

  learningAgreementUrl(applicationId: string): string {
    return `${this.applicationsApiUrl}/${applicationId}/document`;
  }

  transcriptUrl(applicationId: string): string {
    return `${this.applicationsApiUrl}/${applicationId}/transcript/document`;
  }
}
