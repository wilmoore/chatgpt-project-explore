import SwiftUI
import CoreSpotlight
#if os(iOS)
import UIKit
#endif

@main
struct ProjectExplorerApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .onContinueUserActivity(CSSearchableItemActionType) { userActivity in
                    handleSpotlightActivity(userActivity)
                }
                .onOpenURL { url in
                    handleOpenURL(url)
                }
        }
    }

    /// Handles a Spotlight search continuation
    private func handleSpotlightActivity(_ userActivity: NSUserActivity) {
        guard let projectId = SpotlightIndexer.projectId(from: userActivity) else {
            return
        }
        appState.pendingProjectId = projectId
    }

    /// Handles an incoming URL (from Share Extension or deep link)
    private func handleOpenURL(_ url: URL) {
        // Check if this is our app's URL scheme
        guard url.scheme == "projectexplorer" else { return }

        // Handle different URL paths
        switch url.host {
        case "open":
            // Extract the project URL from query parameters
            if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
               let queryItems = components.queryItems,
               let urlParam = queryItems.first(where: { $0.name == "url" })?.value,
               let projectURL = URL(string: urlParam) {
                appState.pendingOpenURL = projectURL
            }
        default:
            break
        }
    }
}

/// App-wide state for handling deep links and Spotlight continuations
@MainActor
final class AppState: ObservableObject {
    /// Project ID pending to be opened (from Spotlight or deep link)
    @Published var pendingProjectId: String?

    /// Project URL pending to be opened (from Share Extension)
    @Published var pendingOpenURL: URL?

    /// Clears the pending project after it's been handled
    func clearPendingProject() {
        pendingProjectId = nil
    }

    /// Clears the pending URL after it's been handled
    func clearPendingOpenURL() {
        pendingOpenURL = nil
    }
}
