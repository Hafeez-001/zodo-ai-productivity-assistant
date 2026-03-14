const base = "/api";

function getAuthHeader() {
  const token = localStorage.getItem("zodo_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const res = await fetch(`${base}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options.headers
    }
  });

  if (res.status === 401) {
    localStorage.removeItem("zodo_token");
    localStorage.removeItem("zodo_user");
    if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

export async function login(username, password) {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function register(username, password) {
  return request("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function updateProfile(updates) {
  return request("/profile", { method: "PUT", body: JSON.stringify(updates) });
}

// --- Tasks ---

export async function createTask(payload) {
  return request("/tasks", { method: "POST", body: JSON.stringify(payload) });
}

export async function getTasks({ sort, tag, archived } = {}) {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  if (tag) params.set("tag", tag);
  if (archived) params.set("archived", "true");
  const qs = params.toString();
  return request(`/tasks${qs ? `?${qs}` : ""}`);
}

export async function patchTask(id, updates) {
  return request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
}

export async function removeTask(id) {
  return request(`/tasks/${id}`, { method: "DELETE" });
}

export async function planCleanup() {
  return request("/tasks/plan-cleanup", { method: "POST" });
}

export async function archiveTasks() {
  return request("/tasks/archive", { method: "POST" });
}

// --- Workload & Behavior ---

export async function getWorkload() {
  return request("/workload");
}

export async function getBehavior() {
  return request("/behavior");
}

// --- Notes ---

export async function createNote(transcript, title) {
  return request("/notes", { method: "POST", body: JSON.stringify({ transcript, title }) });
}

export async function getNotes() {
  return request("/notes");
}

export async function removeNote(id) {
  return request(`/notes/${id}`, { method: "DELETE" });
}

export async function extractTasksFromMeeting(transcript) {
  return request("/notes/extract-tasks", { method: "POST", body: JSON.stringify({ transcript }) });
}

export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  const token = localStorage.getItem("zodo_token");
  const res = await fetch(`${base}/notes/transcribe`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Transcription failed" }));
    throw new Error(error.message || "Transcription failed");
  }
  return res.json();
}

// --- Engagement ---

export async function getWeeklyReport() {
  return request("/weekly-report");
}

export async function getStreak() {
  return request("/streak");
}
