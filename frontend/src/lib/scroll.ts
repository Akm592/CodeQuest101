// Stick-to-bottom for the chat list.
//
// The list used to scroll to the bottom on every streamed chunk, whatever the
// reader was doing, so scrolling up to reread something mid-answer got yanked
// straight back down. It now follows new content only while the reader is
// already at (or near) the bottom.

/**
 * Whether a scroll container is close enough to its end to count as "pinned".
 *
 * The threshold absorbs sub-pixel scroll positions and the last few pixels of
 * a smooth scroll that has not quite landed. A list too short to scroll is
 * always at the bottom.
 */
export function isNearBottom(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  threshold = 80,
): boolean {
  return scrollHeight - (scrollTop + clientHeight) <= threshold;
}
