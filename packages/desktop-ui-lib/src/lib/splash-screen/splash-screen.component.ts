import { Component, OnInit, NgZone } from '@angular/core';
import { ElectronService } from '../electron/services';

@Component({
	selector: 'ngx-screen-capture',
	templateUrl: './splash-screen.component.html',
	styleUrls: ['./splash-screen.component.scss'],
})
export class SplashScreenComponent implements OnInit {
	screenCaptureUrl: string;
	note: string;

	constructor(
		private readonly electronService: ElectronService,
		private _ngZone: NgZone
	) {}

	ngOnInit(): void {
		this.electronService.ipcRenderer.on(
			'show_popup_screen_capture',
			(event, arg) => {
				this._ngZone.run(() => {
					this.screenCaptureUrl = arg.imgUrl;
					this.note = arg.note;
				});
			}
		);
	}
}
