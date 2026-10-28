/**
 * Lets any part of the page tell the Séance orb where to look.
 *
 * Fields call `pointAgentAtCaret` on focus and on each keystroke; the orb listens
 * with `onAgentAttention` and treats the point like a cursor position. `pulse`
 * means "the user just typed", which the orb hears as a little bump of sound.
 */

export type Attention = { x: number; y: number; pulse: boolean };

const EVENT = 'dk:agent-attention';

export function pointAgentAt(attention: Attention) {
  window.dispatchEvent(new CustomEvent<Attention>(EVENT, { detail: attention }));
}

export function onAgentAttention(callback: (attention: Attention) => void) {
  const handler = (event: Event) => callback((event as CustomEvent<Attention>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function pointAgentAtCaret(
  el: HTMLInputElement | HTMLTextAreaElement,
  { pulse }: { pulse: boolean },
) {
  const point = caretClientPoint(el);
  if (point) pointAgentAt({ ...point, pulse });
}

/* Caret position -------------------------------------------------------------------------- */

const mirrored = [
  'boxSizing',
  'width',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'letterSpacing',
  'wordSpacing',
  'textTransform',
  'textIndent',
  'tabSize',
] as const;

/**
 * Screen position of the caret (just after the last typed character), found by
 * laying the text out in an invisible copy of the field.
 */
export function caretClientPoint(el: HTMLInputElement | HTMLTextAreaElement) {
  const position = el.selectionEnd ?? el.value.length;
  const style = getComputedStyle(el);
  const isInput = el instanceof HTMLInputElement;

  const mirror = document.createElement('div');
  for (const prop of mirrored) mirror.style[prop] = style[prop];
  Object.assign(mirror.style, {
    position: 'absolute',
    visibility: 'hidden',
    top: '0',
    left: '-9999px',
    whiteSpace: isInput ? 'pre' : 'pre-wrap',
    overflowWrap: 'break-word',
  });
  mirror.textContent = el.value.slice(0, position);
  const marker = document.createElement('span');
  marker.textContent = '​';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const left = marker.offsetLeft;
  const top = marker.offsetTop;
  const height = marker.offsetHeight;
  mirror.remove();

  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + Math.min(left - el.scrollLeft, rect.width),
    y: isInput ? rect.top + rect.height / 2 : rect.top + top - el.scrollTop + height / 2,
  };
}
