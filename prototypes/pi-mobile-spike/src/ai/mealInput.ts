/** A meal can be analyzed from a description, photos, or both. Share this guard
 * across submission and queued processing so text meals survive retries/restarts. */
export function hasMealInput(input: { photos: readonly unknown[]; note?: string }): boolean {
  return input.photos.length > 0 || Boolean(input.note?.trim());
}

export function mealInputContent(input: { photos: { base64: string; mimeType: string }[]; note?: string }) {
  if (!hasMealInput(input)) throw new Error('A meal description or photo is required');
  return [
    { type: 'text' as const, text: input.note?.trim()
      ? `Analyze this complete meal. User description: ${input.note.trim()}`
      : 'Analyze this complete meal.' },
    ...input.photos.map(photo => ({ type: 'image' as const, data: photo.base64, mimeType: photo.mimeType })),
  ];
}
