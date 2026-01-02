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

/// Loading state for async data
enum LoadingState<T> {
    case idle
    case loading
    case loaded(T)
    case error(Error)
}

/// View displaying the list of projects
struct ProjectListView: View {
    @ObservedObject var settings: AppSettings
    @State private var loadingState: LoadingState<[Project]> = .idle
    @State private var refreshTask: Task<Void, Never>?

    private let apiClient = APIClient()

    var body: some View {
        Group {
            switch loadingState {
            case .idle:
                Color.clear
                    .onAppear { loadProjects() }

            case .loading:
                ProgressView("Loading projects...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .loaded(let projects):
                if projects.isEmpty {
                    ContentUnavailableView(
                        "No Projects",
                        systemImage: "folder",
                        description: Text("No projects found in your index.")
                    )
                } else {
                    List(projects) { project in
                        ProjectRow(project: project)
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
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(destination: SettingsView(settings: settings)) {
                    Image(systemName: "gear")
                }
            }
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
        } catch {
            // On refresh failure, keep existing data but show error somehow
            // For now, just update to error state
            loadingState = .error(error)
        }
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
}
