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
        }
    }

    /// Handles a Spotlight search continuation
    private func handleSpotlightActivity(_ userActivity: NSUserActivity) {
        guard let projectId = SpotlightIndexer.projectId(from: userActivity) else {
            return
        }
        appState.pendingProjectId = projectId
    }
}

/// App-wide state for handling deep links and Spotlight continuations
@MainActor
final class AppState: ObservableObject {
    /// Project ID pending to be opened (from Spotlight or deep link)
    @Published var pendingProjectId: String?

    /// Clears the pending project after it's been handled
    func clearPendingProject() {
        pendingProjectId = nil
    }
}
