export type GenerateInput = {
    prompt: string;
    style?: string;
    title?: string;
    customMode?: boolean;
    instrumental?: boolean;
    model?: string;
    negativeTags?: string;
    vocalGender?: string;
    styleWeight?: number;
    weirdnessConstraint?: number;
    audioWeight?: number;
    callBackUrl?: string;
    // App metadata for persistence
    userId?: string; // Supabase auth user id
    patientId?: string; // Patient ID for associating the song
    withLyrics?: boolean;
    form?: 'AB' | 'ABA';
    moods?: string[]; // Array of mood tags
    tempo_bpm?: number;
    notes?: string;
};

export type UploadExtendInput = {
    uploadUrl: string;
    defaultParamFlag?: boolean; // custom mode
    instrumental?: boolean;
    prompt?: string;
    style?: string;
    title?: string;
    continueAt?: number;
    model?: string;
    negativeTags?: string;
    vocalGender?: string; // 'm' | 'f'
    styleWeight?: number;
    weirdnessConstraint?: number;
    audioWeight?: number;
    callBackUrl?: string;
    // App metadata for persistence
    userId?: string;
    patientId?: string; // Patient ID for associating the song
};

const API_BASE = "/api";

export async function generateTrack(input: GenerateInput) {
  const body = { model: 'V4', ...input };

  console.log("[generateTrack] ✅ POST /api/generate body =", body);

  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


export async function getResult(taskId: string) {
    const res = await fetch(`${API_BASE}/result/${encodeURIComponent(taskId)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getWebhookStatus() {
    const res = await fetch(`${API_BASE}/webhook/status`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function uploadAudio(file: Blob, filename = 'idea.webm') {
    const form = new FormData();
    form.append('file', file, filename);
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ uploadUrl: string }>;
}

export async function uploadExtend(input: UploadExtendInput) {
    const res = await fetch(`${API_BASE}/generate/upload-extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultParamFlag: true, ...input, model: 'V5' }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}