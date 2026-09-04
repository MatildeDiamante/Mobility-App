// Applications services
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InitialApplication } from '../models/application.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  private readonly apiUrl = 'http://localhost:3000/api/applications';

  private readonly http = inject(HttpClient);

  // Methods
  createInitialApplication(
    application: InitialApplication,
    learningAgreement: File,
  ) {
    const formData = new FormData();

    formData.append('academicYear', application.academicYear);
    formData.append('hostUniversity', application.hostUniversity);
    formData.append('duration', application.duration);
    formData.append('referentProfessor', application.referentProfessor);

    formData.append('homeCourses', JSON.stringify(application.homeCourses)); // array conversion
    formData.append('hostCourses', JSON.stringify(application.hostCourses));

    formData.append('document', learningAgreement);

    // Application creation request
    return this.http.post(this.apiUrl, formData, {
      withCredentials: true,
    });
  }

  getMyApplications() {
    return this.http.get(`${this.apiUrl}/me`, {
      withCredentials: true,
    });
  }

  getApplication(applicationId: string) {
    return this.http.get(`${this.apiUrl}/${applicationId}`, {
      withCredentials: true,
    });
  }

  updateMobilityPeriod(
    applicationId: string,
    startDate: string,
    endDate: string,
  ) {
    const formData = new FormData();

    formData.append('startDate', startDate);
    formData.append('endDate', endDate);

    // HTTP request
    return this.http.patch(`${this.apiUrl}/${applicationId}`, formData, {
      withCredentials: true,
    });
  }

  proposeNewMapping(
    applicationId: string,
    homeCourses: string[],
    hostCourses: string[],
    learningAgreement: File,
  ) {
    const formData = new FormData();

    formData.append('homeCourses', JSON.stringify(homeCourses));
    formData.append('hostCourses', JSON.stringify(hostCourses));
    formData.append('document', learningAgreement);

    return this.http.patch(`${this.apiUrl}/${applicationId}`, formData, {
      withCredentials: true,
    });
  }

  completeMobility(applicationId: string) {
    return this.http.patch(
      `${this.apiUrl}/${applicationId}/complete-mobility`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  uploadTranscript(applicationId: string, transcript: File) {
    const formData = new FormData();

    formData.append('transcript', transcript);

    return this.http.post(
      `${this.apiUrl}/${applicationId}/transcript`,
      formData,
      {
        withCredentials: true,
      },
    );
  }

  submitPassedExams(
    applicationId: string,
    passedHostCourses: {
      course: string;
      grade: string;
      examDate: string;
    }[],
  ) {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/exams`,
      { passedHostCourses },
      { withCredentials: true },
    );
  }
}
