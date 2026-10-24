import React from 'react';

/**
 * PhoneFrameContainer: Passthrough container
 * The artificial phone frame/mockup has been permanently removed so the application
 * occupies the real browser/device viewport normally on all platforms.
 */
export default function PhoneFrameContainer({ children }) {
  return <>{children}</>;
}
