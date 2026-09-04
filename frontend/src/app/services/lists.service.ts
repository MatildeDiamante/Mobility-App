// This file contains the ListsService class, which is responsible for fetching various lists of data from the backend API
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CourseOption } from '../models/application.model';

// Declaration of the service
@Injectable({
  providedIn: 'root',
})
export class ListsService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/lists';

  // Methods
  getUniversities() {
    return this.http.get(`${this.apiUrl}/universities`, {
      withCredentials: true,
    });
  }

  getProfessors() {
    return this.http.get(`${this.apiUrl}/professors`, {
      withCredentials: true,
    });
  }

  getHomeCourses() {
    return this.http.get<CourseOption[]>(`${this.apiUrl}/courses?type=home`, {
      withCredentials: true,
    });
  }

  getHostCourses(hostUniversityId: string) {
    return this.http.get<CourseOption[]>(
      `${this.apiUrl}/courses?type=host&hostUniversity=${hostUniversityId}`,
      {
        withCredentials: true,
      },
    );
  }
}
