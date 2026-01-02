import SwiftUI

/// Main container view for the app
struct ContentView: View {
    @StateObject private var settings = AppSettings()

    var body: some View {
        NavigationStack {
            if settings.validationState.isValid {
                ProjectListView(settings: settings)
            } else {
                SettingsView(settings: settings)
            }
        }
    }
}

/// Placeholder view for project list (to be implemented)
struct ProjectListView: View {
    @ObservedObject var settings: AppSettings

    var body: some View {
        List {
            Text("Projects will appear here")
                .foregroundColor(.secondary)
        }
        .navigationTitle("Projects")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(destination: SettingsView(settings: settings)) {
                    Image(systemName: "gear")
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
