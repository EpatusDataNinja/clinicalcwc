# Data Management

Settings supports encrypted JSON backup export, backup import, local data clearing, passcode setup, pending sync count display, and manual sync.

Backups contain encrypted IndexedDB records and sync metadata. They do not export decrypted patient notes.

## Disaster Recovery Validation

To simulate and validate a "Lost Device" recovery:
1. **Export:** On Device A, perform a "Data Export" from Settings.
2. **Wipe:** Use "Clear Local Data" or open a Private/Incognito window to simulate Device B.
3. **Import:** In the fresh environment, go to Settings -> Import.
4. **Decrypt:** Enter the same passcode used on Device A.
5. **Verify:** Navigate to the Dashboard; all cases and tasks should be restored and decryptable.

RTO (Recovery Time Objective): < 2 minutes (manual import).
RPO (Recovery Point Objective): Last manual backup or last successful cloud sync.
