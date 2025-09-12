import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-debug-styles',
  standalone: true,
  template: `
    <div class="debug-wrapper">
      <h1 class="debug-title">DEBUG STYLES TEST</h1>
      <p>If this is RED with BLUE text, component styles work!</p>
    </div>
  `,
  styles: [`
    .debug-wrapper {
      background: red !important;
      padding: 50px !important;
      border: 10px solid blue !important;
    }
    
    .debug-title {
      background: yellow !important;
      color: green !important;
      font-size: 30px !important;
      text-align: center !important;
    }
    
    p {
      color: blue !important;
      font-size: 20px !important;
      font-weight: bold !important;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class DebugStylesComponent {
}
