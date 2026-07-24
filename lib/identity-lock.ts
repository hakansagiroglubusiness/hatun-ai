export const REFERENCE_IDENTITY_LOCK = [
  "IDENTITY LOCK [HIGHEST PRIORITY]:",
  "Use the first uploaded reference image as the sole source of truth for the subject's appearance and identity.",
  "Preserve the subject's recognizable facial identity, facial structure, ethnicity, skin tone, natural hair color and texture, eye color, nose, lips, body proportions, and distinctive permanent markers from that reference.",
  "Any appearance or identity description elsewhere in this prompt—including ethnicity, nationality, age, hair, eyes, skin, facial features, body shape, or identity—is non-binding and must be ignored whenever it differs from the reference image.",
  "Do not copy the reference image's expression, gaze direction, head angle, head tilt, pose, posture, camera angle, framing, outfit, lighting, or background.",
  "Take expression, gaze, head position, pose, posture, outfit, setting, lighting, camera, composition, and mood from the scene prompt so the result feels like a different natural photograph of the same person.",
  "Do not blend identities, beautify the face into a different person, freeze the face into the reference pose, or alter the subject's core identity or proportions.",
].join(" ");

export function withReferenceIdentityLock(prompt: string) {
  const cleaned = stripIdentityDescriptors(prompt);
  return `${REFERENCE_IDENTITY_LOCK}\n\n${cleaned}`;
}

export function stripIdentityDescriptors(prompt: string) {
  const withoutLock = removeExistingIdentityLock(prompt.trim());
  try {
    const structured = JSON.parse(withoutLock) as Record<string, unknown>;
    delete structured.reference_override;
    delete structured.character_lock;
    return JSON.stringify(structured, null, 2);
  } catch {
    return withoutLock;
  }
}

function removeExistingIdentityLock(prompt: string) {
  if (!prompt.startsWith("IDENTITY LOCK [HIGHEST PRIORITY]:")) return prompt;
  const separator = prompt.indexOf("\n\n");
  return separator === -1 ? "" : prompt.slice(separator + 2).trim();
}
