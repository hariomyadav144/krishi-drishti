import { registerPlugin } from '@capacitor/core';
import { isNativeApp } from './api';

export const AppPermissions = registerPlugin('AppPermissions');

export async function checkMicrophonePermission() {
  if (isNativeApp()) {
    try {
      const res = await AppPermissions.checkPermissions();
      return res.microphone === 'granted';
    } catch (e) {
      console.warn('checkMicrophonePermission error:', e);
    }
  }
  return false;
}

export async function requestMicrophonePermission() {
  if (isNativeApp()) {
    try {
      const res = await AppPermissions.requestPermissions();
      return res.microphone === 'granted';
    } catch (e) {
      console.warn('requestMicrophonePermission error:', e);
    }
  }
  return false;
}

export async function openNativeAppSettings() {
  if (isNativeApp()) {
    try {
      await AppPermissions.openSettings();
      return true;
    } catch (e) {
      console.warn('openNativeAppSettings error:', e);
    }
  }
  return false;
}
