const KEY = "zevo_memory_v2";

export function loadMemory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { sessions: [], preferences: {} };
  } catch {
    return { sessions: [], preferences: {} };
  }
}

export function saveSession(analysis, profile, fileName) {
  const mem = loadMemory();
  const session = {
    id: Date.now().toString(),
    name: fileName || `Analysis ${mem.sessions.length + 1}`,
    date: new Date().toISOString(),
    profile,
    rows: analysis?.data_stats?.total_rows || 0,
    anomalies: analysis?.anomalies?.length || 0,
    insights: analysis?.insights?.length || 0,
    dataStory: analysis?.data_story || "",
    fullAnalysis: analysis,
  };
  mem.sessions = [session, ...mem.sessions].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(mem));
  return session;
}

export function renameSession(id, newName) {
  const mem = loadMemory();
  mem.sessions = mem.sessions.map(s => s.id === id ? { ...s, name: newName } : s);
  localStorage.setItem(KEY, JSON.stringify(mem));
}

export function deleteSession(id) {
  const mem = loadMemory();
  mem.sessions = mem.sessions.filter(s => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(mem));
}

export function savePreferences(prefs) {
  const mem = loadMemory();
  mem.preferences = { ...mem.preferences, ...prefs };
  localStorage.setItem(KEY, JSON.stringify(mem));
}

export function clearAllMemory() {
  localStorage.removeItem(KEY);
}