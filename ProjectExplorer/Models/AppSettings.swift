import Foundation
import SwiftUI

/// Represents the validation state of the API URL
enum APIValidationState: Equatable {
    case notValidated
    case validating
    case valid
    case invalid(String)

    var isValid: Bool {
        if case .valid = self { return true }
        return false
    }

    var errorMessage: String? {
        if case .invalid(let message) = self { return message }
        return nil
    }
}

/// Observable settings object for app configuration
@MainActor
final class AppSettings: ObservableObject {

    // MARK: - Storage Keys

    private enum Keys {
        static let baseAPIURL = "baseAPIURL"
    }

    // MARK: - Published Properties

    /// The base URL for the Project Index API
    @Published var baseAPIURL: String {
        didSet {
            UserDefaults.standard.set(baseAPIURL, forKey: Keys.baseAPIURL)
            validationState = .notValidated
        }
    }

    /// Current validation state of the API URL
    @Published var validationState: APIValidationState = .notValidated

    // MARK: - Computed Properties

    /// Returns true if the URL has basic structural validity
    var hasValidURLFormat: Bool {
        guard !baseAPIURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return false
        }
        guard let url = URL(string: baseAPIURL) else {
            return false
        }
        guard let scheme = url.scheme, ["http", "https"].contains(scheme.lowercased()) else {
            return false
        }
        guard url.host != nil else {
            return false
        }
        return true
    }

    // MARK: - Initialization

    init() {
        self.baseAPIURL = UserDefaults.standard.string(forKey: Keys.baseAPIURL) ?? ""
    }

    // MARK: - Validation

    /// Validates the URL format without making a network request
    func validateURLFormat() -> Bool {
        if baseAPIURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            validationState = .invalid("URL cannot be empty")
            return false
        }

        guard let url = URL(string: baseAPIURL) else {
            validationState = .invalid("Invalid URL format")
            return false
        }

        guard let scheme = url.scheme, ["http", "https"].contains(scheme.lowercased()) else {
            validationState = .invalid("URL must start with http:// or https://")
            return false
        }

        guard url.host != nil else {
            validationState = .invalid("URL must include a host")
            return false
        }

        return true
    }

    /// Clears the stored API URL
    func clearAPIURL() {
        baseAPIURL = ""
        validationState = .notValidated
    }
}
