# Share Extension Setup Guide

This guide explains how to configure the Share Extension target in Xcode to enable the "Open in Project Explorer" share sheet action.

## Prerequisites

- Xcode 15 or later
- iOS 17.0+ deployment target

## Steps

### 1. Add Share Extension Target

1. In Xcode, select **File > New > Target**
2. Choose **Share Extension** under iOS
3. Name it: `ProjectExplorerShareExtension`
4. Set Product Name: `ProjectExplorerShareExtension`
5. Set Bundle Identifier: `$(PRODUCT_BUNDLE_IDENTIFIER).ShareExtension`
6. Click **Finish**
7. When prompted to activate the scheme, click **Cancel** (stay on main app scheme)

### 2. Configure Extension Info.plist

Replace the auto-generated `Info.plist` content with the provided `ProjectExplorerShareExtension/Info.plist`:

```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionAttributes</key>
    <dict>
        <key>NSExtensionActivationRule</key>
        <dict>
            <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
            <integer>1</integer>
            <key>NSExtensionActivationSupportsText</key>
            <true/>
        </dict>
    </dict>
    <key>NSExtensionMainStoryboard</key>
    <string>MainInterface</string>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.share-services</string>
</dict>
```

### 3. Replace ShareViewController

1. Delete the auto-generated `ShareViewController.swift`
2. Add the provided `ProjectExplorerShareExtension/ShareViewController.swift` to the target

### 4. Configure URL Scheme in Main App

Add URL scheme to main app's `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.yourcompany.projectexplorer</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>projectexplorer</string>
        </array>
    </dict>
</array>
```

### 5. App Groups (Optional)

For sharing data between the main app and extension:

1. Enable **App Groups** capability for both targets
2. Use a shared identifier: `group.com.yourcompany.projectexplorer`

### 6. Build and Test

1. Build the main app target
2. Run on a device or simulator
3. Open Safari, navigate to a ChatGPT project URL
4. Tap Share button
5. Select "Open in Project Explorer"
6. The app should launch and open the project

## Troubleshooting

### Extension not appearing in Share Sheet

- Ensure the extension target is included in the build
- Check that the activation rules allow URLs
- Restart the simulator/device

### URL not passing to main app

- Verify URL scheme is registered correctly
- Check that `handleOpenURL` is implemented in `ProjectExplorerApp`
- Ensure the extension is signed with the same team as the main app

## File Structure

```
ProjectExplorerShareExtension/
  ShareViewController.swift  - Main extension logic
  Info.plist                 - Extension configuration
  MainInterface.storyboard   - (auto-generated, can be empty)
```
