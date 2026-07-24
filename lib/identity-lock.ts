export const REFERENCE_IDENTITY_LOCK = [
  "IDENTITY LOCK [HIGHEST PRIORITY]:",
  "Use the first uploaded reference image as the sole source of truth for the subject's appearance and identity.",
  "Preserve the exact face, facial structure, age appearance, ethnicity, skin tone, hair color, hairstyle, hair texture, eye color and shape, nose, lips, body proportions, facial accessories, and distinctive markers from that reference.",
  "Any appearance or identity description elsewhere in this prompt—including ethnicity, nationality, age, hair, eyes, skin, facial features, body shape, or identity—is non-binding and must be ignored whenever it differs from the reference image.",
  "Apply only the requested pose, expression, outfit, setting, lighting, camera, composition, and mood.",
  "Do not blend identities, beautify the face into a different person, or alter the subject's core identity or proportions.",
].join(" ");

export function withReferenceIdentityLock(prompt: string) {
  const trimmed = prompt.trim();
  if (trimmed.startsWith(REFERENCE_IDENTITY_LOCK)) return trimmed;
  return `${REFERENCE_IDENTITY_LOCK}\n\n${trimmed}`;
}
