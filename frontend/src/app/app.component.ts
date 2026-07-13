import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <div style="text-align: center; padding: 20px;">
      <h1>Welcome to Mobility App</h1>
      <p>Angular Frontend is running</p>
      <p>Connected to port 4200</p>
    </div>
  `,
  standalone: true,
})
export class AppComponent {
  title = "mobility-app-frontend";
}
