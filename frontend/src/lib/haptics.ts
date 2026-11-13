// Native haptic feedback. Wraps the Capacitor Haptics plugin so the rest of the
// app can fire feedback without caring whether it's running natively — on web /
// desktop these are safe no-ops. This is a big part of what makes the app "feel
// native" on iPhone: taps, toggles, and confirmations get real tactile feedback.

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const native = Capacitor.isNativePlatform();

/** Light tap — for buttons, nav, and general UI taps. */
export function tapLight() {
  if (native) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Medium tap — for meaningful selections (toggles, choosing an option). */
export function tapMedium() {
  if (native) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

/** Success buzz — for completed actions like saving a log. */
export function notifySuccess() {
  if (native) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

/** Warning buzz — for blocked actions (e.g. content rejected by the filter). */
export function notifyWarning() {
  if (native) Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
}
