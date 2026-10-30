import { Alert, Platform } from 'react-native';

// React Native's Alert does nothing useful in a browser, so use the browser's own dialogs there.
/* eslint-disable @typescript-eslint/no-explicit-any */
const browser = globalThis as any;

/** Show a short message. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    browser.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Ask the user to confirm a destructive action, then run `onConfirm`. */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void | Promise<void>,
): void {
  if (Platform.OS === 'web') {
    if (browser.confirm(`${title}\n\n${message}`)) void onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: () => void onConfirm() },
  ]);
}
