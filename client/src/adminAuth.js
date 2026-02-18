const KEY = "admin_auth";

export function setAdminAuth(authHeader) {
  sessionStorage.setItem(KEY, authHeader);
}

export function getAdminAuth() {
  return sessionStorage.getItem(KEY) || "";
}

export function clearAdminAuth() {
  sessionStorage.removeItem(KEY);
}

export function isAdminLoggedIn() {
  return !!getAdminAuth();
}

export function adminFetch(url, options = {}) {
  const auth = getAdminAuth();

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: auth,
    },
  });
}
