import UIKit
import Social
import UniformTypeIdentifiers

/// Share Extension for opening ChatGPT project URLs from other apps
class ShareViewController: UIViewController {

    /// The URL scheme for the main app
    private let appURLScheme = "projectexplorer"

    override func viewDidLoad() {
        super.viewDidLoad()
        handleSharedContent()
    }

    /// Processes shared content from the Share Sheet
    private func handleSharedContent() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            completeRequest(success: false)
            return
        }

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }

            for provider in attachments {
                // Handle URLs
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] item, _ in
                        if let url = item as? URL {
                            self?.processURL(url)
                        }
                    }
                    return
                }

                // Handle plain text (which might be a URL)
                if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] item, _ in
                        if let text = item as? String, let url = URL(string: text) {
                            self?.processURL(url)
                        } else {
                            self?.completeRequest(success: false)
                        }
                    }
                    return
                }
            }
        }

        completeRequest(success: false)
    }

    /// Processes a shared URL
    private func processURL(_ url: URL) {
        // Check if this is a ChatGPT project URL
        guard isChatGPTProjectURL(url) else {
            completeRequest(success: false)
            return
        }

        // Open the main app with the project URL
        openMainApp(with: url)
    }

    /// Checks if the URL is a ChatGPT project URL
    private func isChatGPTProjectURL(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }

        // ChatGPT project URLs are typically on chatgpt.com
        let validHosts = ["chatgpt.com", "chat.openai.com"]
        return validHosts.contains(host)
    }

    /// Opens the main app with the project URL
    private func openMainApp(with url: URL) {
        // Encode the project URL and create an app URL
        guard let encodedURL = url.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            completeRequest(success: false)
            return
        }

        let appURL = URL(string: "\(appURLScheme)://open?url=\(encodedURL)")

        // Open the main app
        // Note: Share extensions can't directly open URLs, so we need to use a workaround
        // The main app needs to register a URL scheme and handle the incoming URL

        // For now, we'll use the responder chain to open the URL
        // This requires the main app to be configured with the URL scheme
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                if let appURL = appURL {
                    application.open(appURL, options: [:]) { [weak self] success in
                        self?.completeRequest(success: success)
                    }
                    return
                }
            }
            responder = responder?.next
        }

        // Fallback: Copy to pasteboard and show alert
        UIPasteboard.general.url = url
        showCopiedAlert()
    }

    /// Shows an alert indicating the URL was copied
    private func showCopiedAlert() {
        let alert = UIAlertController(
            title: "URL Copied",
            message: "The project URL has been copied to your clipboard. Open Project Explorer to access it.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.completeRequest(success: true)
        })
        present(alert, animated: true)
    }

    /// Completes the extension request
    private func completeRequest(success: Bool) {
        if success {
            extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
        } else {
            let error = NSError(domain: "ProjectExplorerShareExtension", code: 1, userInfo: nil)
            extensionContext?.cancelRequest(withError: error)
        }
    }
}
