import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  constructor(private router: Router) {}

  goToScan() {
  	this.router.navigateByUrl('/tabs/tab1');
  }

  goToSearch() {
  	this.router.navigateByUrl('tabs/tab2');
  }

  goToAbout() {
  	this.router.navigateByUrl('/about');
  }

}
