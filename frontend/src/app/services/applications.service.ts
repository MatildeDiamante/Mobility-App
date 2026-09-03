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

  updateMobilityPeriod(mobilityStartDate: string, mobilityEndDate: string) {
    const formData = new FormData();

    formData.append('startDate', mobilityStartDate);
    formData.append('endDate', mobilityEndDate);

    // HTTP request
    return this.http.patch(`${this.apiUrl}/me`, formData, {
      withCredentials: true,
    });
  }

  proposeNewMapping(
    homeCourses: string[],
    hostCourses: string[],
    learningAgreement: File,
  ) {
    const formData = new FormData();

    formData.append('homeCourses', JSON.stringify(homeCourses));
    formData.append('hostCourses', JSON.stringify(hostCourses));
    formData.append('document', learningAgreement);

    return this.http.patch(`${this.apiUrl}/me`, formData, {
      withCredentials: true,
    });
  }

  uploadTranscript(transcript: File) {
    const formData = new FormData();

    formData.append('transcript', transcript);

    return this.http.post(`${this.apiUrl}/me/transcript`, formData, {
      withCredentials: true,
    });
  }

  getMyApplication() {
    return this.http.get(`${this.apiUrl}/me`, {
      withCredentials: true,
    });
  }
}
