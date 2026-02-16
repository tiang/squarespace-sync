const axios = require("axios");
const config = require("../config");

const BASE_URL = "https://app.iclasspro.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";

class AuthService {
  constructor() {
    this.sessionCookie = null;
  }

  async login() {
    const loginUrl = `${BASE_URL}/a/${config.iclasspro.account}/`;
    const formData = new URLSearchParams({
      stafflogin: "1",
      uname: config.iclasspro.username,
      passwd: config.iclasspro.password,
      stayloggedin: "1",
    });

    const response = await axios.post(loginUrl, formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Origin: BASE_URL,
        Referer: loginUrl,
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });

    const cookies = response.headers["set-cookie"];
    if (!cookies) {
      throw new Error("Login failed: no Set-Cookie header in response");
    }

    const icpCookie = cookies
      .map((c) => c.split(";")[0])
      .findLast((c) => c.startsWith("ICLASSPRO="));

    if (!icpCookie) {
      throw new Error("Login failed: ICLASSPRO cookie not found");
    }

    this.sessionCookie = icpCookie;
    return this.sessionCookie;
  }

  createClient() {
    if (!this.sessionCookie) {
      throw new Error("Not logged in. Call login() first.");
    }

    return axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: `${this.sessionCookie}; ICPAPP=ICLASSPRO`,
      },
    });
  }
}

module.exports = new AuthService();
