const API = {
	endpoint: "/auth/",
	// ADD HERE ALL THE OTHER API FUNCTIONS
	makePostRequest: async (url, data) => {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});
		return await response.json();
	},
	login: async (user) => {
		return await API.makePostRequest(API.endpoint + "login", user);
	},
	register: async (user) => {
		return await API.makePostRequest(API.endpoint + "register", user);
	},
};

export default API;
