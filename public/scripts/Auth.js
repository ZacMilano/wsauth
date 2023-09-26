import API from "./API.js";
import Router from "./Router.js";

const Auth = {
	isLoggedIn: false,
	account: null,
	challenge: null,
	loginStep: 1,
	logout() {
		Auth.isLoggedIn = false;
		Auth.account = null;
		Auth.updateStatus();
		Router.go("/");

		if (window.PasswordCredential) {
			navigator.credentials.preventSilentAccess();
		}
	},
	async checkAuthOptions() {
		const response = await API.checkAuthOptions({
			email: document.getElementById("login_email").value,
		});

		document.getElementById("login_section_password").hidden =
			!response.password;
		document.getElementById("login_section_webauthn").hidden =
			!response.webauthn;

		Auth.loginStep = 2;
		Auth.challenge = response.challenge;
	},
	async login(event) {
		event.preventDefault();
		if (Auth.loginStep === 1) {
			// TODO check options
			await Auth.checkAuthOptions();
		} else {
			// Send password box
			const user = {
				email: document.getElementById("login_email").value,
				password: document.getElementById("login_password").value,
			};
			const response = await API.login(user);

			Auth.postLogin(response, {
				...user,
				name: response.name,
			});
		}
	},
	async register(event) {
		event.preventDefault();
		const user = {
			email: document.getElementById("register_email").value,
			password: document.getElementById("register_password").value,
			name: document.getElementById("register_name").value,
		};
		const response = await API.register(user);
		Auth.postLogin(response, user);
	},
	postLogin(response, user) {
		if (response.ok) {
			Auth.isLoggedIn = true;
			Auth.account = user;
			Auth.updateStatus();
			Router.go("/account");
			Auth.loginStep = 2;

			// If we enable and WANT autologin
			if (window.PasswordCredential && user.password) {
				const credential = new PasswordCredential({
					name: user.name,
					id: user.email,
					password: user.password,
				});
				navigator.credentials.store(credential);
			}
		} else {
			alert(response.message);
		}
	},
	autoLogin: async () => {
		if (window.PasswordCredential) {
			const credentials = await navigator.credentials.get({ password: true });
			try {
				document.getElementById("login_email").value = credentials.id;
				document.getElementById("login_password").value = credentials.password;
				Auth.login();
			} catch (e) {}
		}
	},
	updateStatus() {
		if (Auth.isLoggedIn && Auth.account) {
			document
				.querySelectorAll(".logged_out")
				.forEach((e) => (e.style.display = "none"));
			document
				.querySelectorAll(".logged_in")
				.forEach((e) => (e.style.display = "block"));
			document
				.querySelectorAll(".account_name")
				.forEach((e) => (e.innerHTML = Auth.account.name));
			document
				.querySelectorAll(".account_username")
				.forEach((e) => (e.innerHTML = Auth.account.email));
		} else {
			document
				.querySelectorAll(".logged_out")
				.forEach((e) => (e.style.display = "block"));
			document
				.querySelectorAll(".logged_in")
				.forEach((e) => (e.style.display = "none"));
		}
	},
	init: () => {
		Auth.loginStep = 1;
		document.getElementById("login_section_password").hidden = true;
	},
};
Auth.updateStatus();

export default Auth;

// make it a global object
window.Auth = Auth;
