/**
 * API configuration for backend requests.
 * Set NEXT_PUBLIC_API_URL in .env.local to override (e.g. for production).
 */
export const API_BASE_URL =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "http://localhost:8000";

/* ---------- Auth ---------- */
export type LoginRequest = { username: string; password: string };
export type LoginResponse = {
    success: boolean;
    user?: { username: string };
    message?: string;
};

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.detail ?? data.message ?? `Login failed: ${res.status}`);
    }
    return data;
}

/* ---------- Projects ---------- */
export type ApiProject = {
    id: string;
    name: string;
    created_at: string;
    design_specs: Array<{ filename: string; object_key: string; uploaded_at: string }>;
};

export type ProjectListResponse = { projects: ApiProject[] };

export async function listProjects(): Promise<ProjectListResponse> {
    const res = await fetch(`${API_BASE_URL}/api/projects/list`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.detail ?? `Failed to list projects: ${res.status}`);
    }
    return data;
}

export async function createProject(name: string): Promise<ApiProject> {
    const res = await fetch(`${API_BASE_URL}/api/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.detail ?? `Failed to create project: ${res.status}`);
    }
    return data;
}

export async function uploadDesignSpec(
    projectId: string,
    file: File
): Promise<{ filename: string; project_id: string; object_key: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(
        `${API_BASE_URL}/api/upload/design?project_id=${encodeURIComponent(projectId)}`,
        { method: "POST", body: formData }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.detail ?? `Failed to upload design spec: ${res.status}`);
    }
    return data;
}

/* ---------- Detection ---------- */
export type DetectionResponse = {
    response: string;
    model?: string;
    inference_time_ms?: number;
};

export async function detectFod(file: File): Promise<DetectionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/detect`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `Detection failed: ${res.status}`);
    }

    return res.json();
}
