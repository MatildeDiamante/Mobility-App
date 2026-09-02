import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CourseOption } from '../models/application.model';

@Injectable({
  providedIn: 'root',
})
export class ListsService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api/lists';

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

  getHostCourses() {
    return this.http.get<CourseOption[]>(`${this.apiUrl}/courses?type=host`, {
      withCredentials: true,
    });
  }
}
