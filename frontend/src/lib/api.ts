export const authApi = {
  async logout() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
    } catch {
      // noop
    }
  },
};
