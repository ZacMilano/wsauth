import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import * as url from "url";
import bcrypt from "bcryptjs";
import * as jwtJsDecode from "jwt-js-decode";
import base64url from "base64url";
import SimpleWebAuthnServer from "@simplewebauthn/server";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const app = express();
app.use(express.json());

const adapter = new JSONFile(__dirname + "/auth.json");
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] };

const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

function findUser(email) {
	const results = db.data.users.filter((u) => u.email == email);
	if (results.length == 0) return undefined;
	return results[0];
}

app.use(express.static("public"));
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);

// ADD HERE THE REST OF THE ENDPOINTS

// Login
app.post("/auth/login", (req, res) => {
	const user = findUser(req.body.email);
	if (user) {
		// user exists, check password
		if (bcrypt.compareSync(req.body.password, user.password)) {
			res.send({ ok: true, email: user.email, name: user.name });
		} else {
			res.send({ ok: false, message: "Data is invalid" });
		}
	} else {
		// User doesn't exist
		res.send({ ok: false, message: "Data is invalid" });
	}
});

app.post("/auth/register", (req, res) => {
	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(req.body.password, salt);

	const user = {
		name: req.body.name,
		email: req.body.email,
		password: hash,
	};

	const userFound = findUser(user.email);
	if (userFound) {
		res.send({ ok: false, message: "User already exists!" });
	} else {
		// Create new user
		db.data.users.push(user);
		db.write();
		res.send({ ok: true });
	}
});

app.post("/auth/auth-options", (req, res) => {
	const user = findUser(req.body.email);
	if (user) {
		res.send({
			password: user.password !== null,
			webauth: user.webauth !== null,
			google: user.google !== null,
		});
	} else {
		// Don't say whether or not user exists; say password is allowed, even if not possible
		res.send({ password: true });
	}
});

app.get("*", (req, res) => {
	res.sendFile(__dirname + "public/index.html");
});

app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
