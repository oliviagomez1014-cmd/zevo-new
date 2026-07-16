// voiceEngine.js
// Real human voice via ElevenLabs, with automatic fallback to browser voice.

const ELEVENLABS_KEY = "sk_2c1fdf63e054040fa57e7e786457016e0cb02d33ade8d091"; // leave as-is to auto-fallback
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // "Rachel" - calm, clear, professional female voice

let currentAudio = null;

export async function speakHuman(text) {
  stopSpeaking();

  const hasKey = ELEVENLABS_KEY && ELEVENLABS_KEY !== "sk_2c1fdf63e054040fa57e7e786457016e0cb02d33ade8d091";

  if (!hasKey) {
    speakBrowserFallback(text);
    return;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_KEY,
      },
      body: JSON.stringify({
        text: text.slice(0, 2000),
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) throw new Error("ElevenLabs request failed");

    const audioBlob = await response.blob();
    const url = URL.createObjectURL(audioBlob);
    currentAudio = new Audio(url);
    currentAudio.play();
    currentAudio.onended = () => URL.revokeObjectURL(url);
  } catch (e) {
    console.warn("ElevenLabs failed, falling back to browser voice:", e);
    speakBrowserFallback(text);
  }
}

function speakBrowserFallback(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.name.includes("Google UK English Female") ||
           v.name.includes("Samantha") ||
           v.name.includes("Google US English") ||
           v.name.includes("Female")
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}