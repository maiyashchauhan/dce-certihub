// Re-export OneDrive services for backward compatibility
export * from './oneDrive';
export {
  getOneDriveClientId as getGoogleClientId,
  setOneDriveClientId as setGoogleClientId,
  isAutoSaveToOneDriveEnabled as isAutoSaveToDriveEnabled,
  setAutoSaveToOneDrive as setAutoSaveToDrive,
  getOneDriveFolderName as getDriveFolderName,
  setOneDriveFolderName as setDriveFolderName,
  getConnectedOneDriveUser as getConnectedGoogleUser,
  authorizeOneDrive as authorizeGoogleDrive,
  disconnectOneDrive as disconnectGoogleDrive,
  uploadCertificateToOneDrive as uploadCertificateToDrive,
  getRecentOneDriveUploads as getRecentDriveUploads
} from './oneDrive';
