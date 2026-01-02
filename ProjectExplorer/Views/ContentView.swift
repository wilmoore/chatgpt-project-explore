import SwiftUI
#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

/// Main container view for the app
struct ContentView: View {
    @StateObject private var settings = AppSettings()
    @EnvironmentObject private var appState: AppState

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

/// Loading state for async data
enum LoadingState<T> {
    case idle
    case loading
    case loaded(T)
    case error(Error)
}

/// View displaying the list of projects with search functionality
struct ProjectListView: View {
    @ObservedObject var settings: AppSettings
    @EnvironmentObject private var appState: AppState
    @State private var loadingState: LoadingState<[Project]> = .idle
    @State private var refreshTask: Task<Void, Never>?
    @State private var searchText: String = ""

    private let apiClient = APIClient()

    /// All loaded projects
    private var allProjects: [Project] {
        guard case .loaded(let projects) = loadingState else {
            return []
        }
        return projects
    }

    /// Filters projects based on the current search text
    private var filteredProjects: [Project] {
        let trimmedQuery = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else {
            return allProjects
        }

        return allProjects.filter { project in
            project.matchesSearch(query: trimmedQuery)
        }
    }

    var body: some View {
        Group {
            switch loadingState {
            case .idle:
                Color.clear
                    .onAppear { loadProjects() }

            case .loading:
                ProgressView("Loading projects...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .loaded:
                if filteredProjects.isEmpty && !searchText.isEmpty {
                    ContentUnavailableView.search(text: searchText)
                } else if filteredProjects.isEmpty {
                    ContentUnavailableView(
                        "No Projects",
                        systemImage: "folder",
                        description: Text("No projects found in your index.")
                    )
                } else {
                    List(filteredProjects) { project in
                        ProjectRow(project: project)
                            .onTapGesture {
                                openProject(project)
                            }
                    }
                    .refreshable {
                        await refreshProjects()
                    }
                }

            case .error(let error):
                ContentUnavailableView {
                    Label("Error", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(error.localizedDescription)
                } actions: {
                    Button("Retry") {
                        loadProjects()
                    }
                }
            }
        }
        .navigationTitle("Projects")
        .searchable(text: $searchText, prompt: "Search projects")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(destination: SettingsView(settings: settings)) {
                    Image(systemName: "gear")
                }
            }
        }
        .onChange(of: appState.pendingProjectId) { _, pendingId in
            handlePendingProject(pendingId)
        }
        .onChange(of: appState.pendingOpenURL) { _, pendingURL in
            handlePendingOpenURL(pendingURL)
        }
    }

    private func loadProjects() {
        loadingState = .loading
        refreshTask?.cancel()
        refreshTask = Task {
            do {
                let projects = try await apiClient.fetchProjects(baseURL: settings.baseAPIURL)
                if !Task.isCancelled {
                    loadingState = .loaded(projects)
                    // Index projects for Spotlight search
                    SpotlightIndexer.indexProjects(projects)
                }
            } catch {
                if !Task.isCancelled {
                    loadingState = .error(error)
                }
            }
        }
    }

    private func refreshProjects() async {
        do {
            let projects = try await apiClient.fetchProjects(baseURL: settings.baseAPIURL)
            loadingState = .loaded(projects)
            // Re-index projects for Spotlight search
            SpotlightIndexer.indexProjects(projects)
        } catch {
            // On refresh failure, keep existing data but show error somehow
            // For now, just update to error state
            loadingState = .error(error)
        }
    }

    /// Opens a project's URL in the external browser (ChatGPT)
    private func openProject(_ project: Project) {
        #if os(iOS)
        UIApplication.shared.open(project.openURL)
        #elseif os(macOS)
        NSWorkspace.shared.open(project.openURL)
        #endif
    }

    /// Handles a pending project ID from Spotlight or deep link
    private func handlePendingProject(_ projectId: String?) {
        guard let projectId = projectId else { return }

        // Find the project and open it
        if let project = allProjects.first(where: { $0.id == projectId }) {
            openProject(project)
            appState.clearPendingProject()
        }
    }

    /// Handles a pending URL from Share Extension
    private func handlePendingOpenURL(_ url: URL?) {
        guard let url = url else { return }

        // Open the URL directly in the external browser (ChatGPT)
        #if os(iOS)
        UIApplication.shared.open(url)
        #elseif os(macOS)
        NSWorkspace.shared.open(url)
        #endif

        appState.clearPendingOpenURL()
    }
}

/// Row displaying a single project
struct ProjectRow: View {
    let project: Project

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(project.name)
                .font(.headline)

            if let description = project.description, !description.isEmpty {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
