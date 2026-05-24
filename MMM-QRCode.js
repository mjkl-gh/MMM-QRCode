/* global Module QRCode */

/* MagicMirror²
 * Module: QRCode
 *
 * By Evghenii Marinescu https://github.com/uxigene/
 * MIT Licensed.
 */


Module.register("MMM-QRCode", {

	defaults: {
		text: "https://github.com/uxigene/MMM-QRCode",
		textUrl: null,
		responseField: null,
		updateInterval: 60000,
		colorDark: "#fff",
		colorLight: "#000",
		imageSize: 150,
		showRaw: true
	},

	getStyles() {
		return ["MMM-QRCode.css"];
	},

	getScripts() {
		return [this.file("node_modules/qrcode/build/qrcode.js")];
	},


	start() {
		this.config = { ...this.defaults, ...this.config };
		this.qrText = this.config.text;
		Log.log(`Starting module: ${this.name}`);

		if (this.config.textUrl) {
			this.fetchText();
			setInterval(() => { this.fetchText(); }, this.config.updateInterval);
		}
	},

	fetchText() {
		this.sendSocketNotification("FETCH_TEXT", {
			url: this.config.textUrl,
			responseField: this.config.responseField
		});
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "TEXT_FETCHED") {
			this.qrText = payload.text;
			this.updateDom();
			if (payload.expiresAt) {
				const msUntilExpiry = (payload.expiresAt * 1000) - Date.now();
				const refreshIn = Math.max(msUntilExpiry - 5000, 5000);
				if (this.expiryTimer) { clearTimeout(this.expiryTimer); }
				this.expiryTimer = setTimeout(() => { this.fetchText(); }, refreshIn);
			}
		} else if (notification === "FETCH_ERROR") {
			Log.error(`${this.name}: Failed to fetch text: ${payload.error}`);
		}
	},

	getDom() {
		const wrapperEl = document.createElement("div");
		wrapperEl.classList.add("qrcode");

		const qrcodeEl = document.createElement("canvas");

		const options = {
			width: this.config.imageSize,
			color: {
				dark: this.config.colorDark,
				light: this.config.colorLight
			},
			errorCorrectionLevel: "H"
		};

		QRCode.toCanvas(
			qrcodeEl,
			this.qrText,
			options,
			(error) => {
				if (error) { Log.error(`${this.name}: Error creating QRCode: ${error}`); }
				Log.log(`${this.name}: successfully created QRCode.`);
			}
		);

		const imageEl = document.createElement("div");
		imageEl.classList.add("qrcode__image");
		imageEl.appendChild(qrcodeEl);

		wrapperEl.appendChild(imageEl);

		if (this.config.showRaw) {
			const textEl = document.createElement("div");
			textEl.classList.add("qrcode__text");
			textEl.innerText = this.qrText;
			wrapperEl.appendChild(textEl);
		}

		return wrapperEl;
	}
});
