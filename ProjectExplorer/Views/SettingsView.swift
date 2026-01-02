import SwiftUI

/// View for configuring the base API URL
struct SettingsView: View {
    @ObservedObject var settings: AppSettings
    @State private var urlInput: String = ""
    @State private var isValidating = false

    private let apiClient = APIClient()

    var body: some View {
        Form {
            Section {
                TextField("https://api.example.com", text: $urlInput)
                    .textContentType(.URL)
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                    .onChange(of: urlInput) { _, newValue in
                        settings.baseAPIURL = newValue
                    }
            } header: {
                Text("Base API URL")
            } footer: {
                validationFooter
            }

            Section {
                Button(action: validateURL) {
                    HStack {
                        Text("Validate")
                        Spacer()
                        if isValidating {
                            ProgressView()
                        } else if settings.validationState.isValid {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        }
                    }
                }
                .disabled(urlInput.isEmpty || isValidating)
            }

            if settings.validationState.isValid {
                Section {
                    Label("API Connected", systemImage: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } header: {
                    Text("Status")
                }
            }
        }
        .navigationTitle("Settings")
        .onAppear {
            urlInput = settings.baseAPIURL
        }
    }

    @ViewBuilder
    private var validationFooter: some View {
        switch settings.validationState {
        case .notValidated:
            Text("Enter the URL of your Project Index API")
                .foregroundColor(.secondary)
        case .validating:
            Text("Validating...")
                .foregroundColor(.secondary)
        case .valid:
            Text("API URL is valid and reachable")
                .foregroundColor(.green)
        case .invalid(let message):
            Text(message)
                .foregroundColor(.red)
        }
    }

    private func validateURL() {
        guard settings.validateURLFormat() else { return }

        isValidating = true
        settings.validationState = .validating

        Task {
            do {
                _ = try await apiClient.validateAPI(baseURL: settings.baseAPIURL)
                await MainActor.run {
                    settings.validationState = .valid
                    isValidating = false
                }
            } catch {
                await MainActor.run {
                    settings.validationState = .invalid(error.localizedDescription)
                    isValidating = false
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        SettingsView(settings: AppSettings())
    }
}
