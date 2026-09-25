const express = require('express');
const router = express.Router();

// Current production app version info
const APP_VERSION_INFO = {
  success: true,
  latestVersion: '1.0.1',
  latestVersionCode: 2,
  minRequiredVersion: '1.0.0',
  minRequiredVersionCode: 1,
  updateUrl: 'https://play.google.com/store/apps/details?id=com.fasaldristi.app',
  apkUrl: 'https://github.com/hariomyadav144/krishi-drishti/releases/latest',
  title: 'New Fasal Drishti Version Available',
  titleHi: 'फ़सल दृष्टि का नया अपडेट उपलब्ध है 🌱',
  releaseNotes: '• Enhanced Sentinel-2 satellite NDVI resolution\n• AI leaf scanner precision update\n• Faster GPS field boundary calculation\n• VIP presentation mode for large screens',
  releaseNotesHi: '• उपग्रह Sentinel-2 फसल स्वास्थ्य रडार अपडेट\n• AI पत्ती स्कैनर और अधिक सटीक\n• जीपीएस खेत मैपिंग में नई सुविधाएं\n• बड़ी स्क्रीन व प्रोजेक्टर के लिए प्रस्तुति मोड',
  isMandatory: false,
};

// @route GET /api/app/version-check
// @desc Check if client app needs an update
router.get('/version-check', (req, res) => {
  const clientVersion = req.query.version || '1.0.0';
  const clientVersionCode = parseInt(req.query.versionCode || '1', 10);

  const hasUpdate = clientVersionCode < APP_VERSION_INFO.latestVersionCode;
  const isMandatory = clientVersionCode < APP_VERSION_INFO.minRequiredVersionCode;

  res.json({
    ...APP_VERSION_INFO,
    hasUpdate,
    isMandatory,
    clientVersion,
    clientVersionCode,
  });
});

module.exports = router;
