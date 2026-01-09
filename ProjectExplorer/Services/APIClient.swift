import Foundation

/// Errors that can occur during API operations
enum APIError: LocalizedError {
    case invalidURL
    case networkError(Error)
    case invalidResponse
    case httpError(Int)
    case decodingError(Error)
    case missingRequiredFields([String])

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .missingRequiredFields(let fields):
            return "Missing required fields: \(fields.joined(separator: ", "))"
        }
    }
}

/// Response from the /meta endpoint
struct APIMetaResponse: Codable {
    let version: String?
    let name: String?
    let projectCount: Int?

    enum CodingKeys: String, CodingKey {
        case version
        case name
        case projectCount = "project_count"
    }

    /// Required fields that must be present for API compatibility
    static let requiredFields = ["version"]

    /// Validates that all required fields are present
    /// - Throws: APIError.missingRequiredFields if any required fields are missing
    func validateRequiredFields() throws {
        var missingFields: [String] = []

        if version == nil || version?.isEmpty == true {
            missingFields.append("version")
        }

        if !missingFields.isEmpty {
            throw APIError.missingRequiredFields(missingFields)
        }
    }

    /// Returns a human-readable description of the API
    var displayDescription: String {
        var parts: [String] = []
        if let name = name, !name.isEmpty {
            parts.append(name)
        }
        if let version = version, !version.isEmpty {
            parts.append("v\(version)")
        }
        if let count = projectCount {
            parts.append("\(count) projects")
        }
        return parts.isEmpty ? "API Connected" : parts.joined(separator: " • ")
    }
}

/// Supabase project record structure
private struct SupabaseProject: Codable {
    let id: String
    let title: String
    let url: String
    let createdAt: String?
    let updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case url
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    /// Converts to the app's Project model
    func toProject() -> Project? {
        guard let openURL = URL(string: url) else { return nil }

        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        return Project(
            id: id,
            name: title,
            openURL: openURL,
            description: nil,
            createdAt: createdAt.flatMap { dateFormatter.date(from: $0) },
            updatedAt: updatedAt.flatMap { dateFormatter.date(from: $0) }
        )
    }
}

/// Client for interacting with the Project Index API
actor APIClient {

    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    /// Detects if the base URL is a Supabase REST API
    private func isSupabaseAPI(_ baseURL: String) -> Bool {
        return baseURL.contains("/rest/v1")
    }

    /// Validates the API by calling the /meta endpoint or fetching project count for Supabase
    /// - Parameter baseURL: The base URL of the API
    /// - Returns: The meta response if successful
    func validateAPI(baseURL: String) async throws -> APIMetaResponse {
        // For Supabase REST API, validate by fetching project count
        if isSupabaseAPI(baseURL) {
            return try await validateSupabaseAPI(baseURL: baseURL)
        }

        guard var urlComponents = URLComponents(string: baseURL) else {
            throw APIError.invalidURL
        }

        // Ensure path ends with /meta
        if !urlComponents.path.hasSuffix("/meta") {
            if urlComponents.path.hasSuffix("/") {
                urlComponents.path += "meta"
            } else {
                urlComponents.path += "/meta"
            }
        }

        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 10

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode)
        }

        let meta: APIMetaResponse
        do {
            meta = try JSONDecoder().decode(APIMetaResponse.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }

        // Validate required fields are present
        try meta.validateRequiredFields()

        return meta
    }

    /// Validates a Supabase REST API by fetching project count
    private func validateSupabaseAPI(baseURL: String) async throws -> APIMetaResponse {
        guard var urlComponents = URLComponents(string: baseURL) else {
            throw APIError.invalidURL
        }

        // Add count query parameter for HEAD request
        if !urlComponents.path.hasSuffix("/projects") {
            if urlComponents.path.hasSuffix("/") {
                urlComponents.path += "projects"
            } else {
                urlComponents.path += "/projects"
            }
        }
        urlComponents.queryItems = [URLQueryItem(name: "select", value: "count")]

        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "HEAD"
        request.setValue("exact", forHTTPHeaderField: "Prefer")
        request.timeoutInterval = 10

        let (_, response): (Data, URLResponse)
        do {
            (_, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode)
        }

        // Extract count from Content-Range header (e.g., "0-9/42")
        var projectCount: Int? = nil
        if let contentRange = httpResponse.value(forHTTPHeaderField: "Content-Range"),
           let totalPart = contentRange.split(separator: "/").last,
           let total = Int(totalPart) {
            projectCount = total
        }

        return APIMetaResponse(
            version: "1.0.0",
            name: "Supabase Project Index",
            projectCount: projectCount
        )
    }

    /// Fetches all projects from the API
    /// - Parameter baseURL: The base URL of the API
    /// - Returns: Array of projects
    func fetchProjects(baseURL: String) async throws -> [Project] {
        // For Supabase REST API, use direct table query
        if isSupabaseAPI(baseURL) {
            return try await fetchSupabaseProjects(baseURL: baseURL)
        }

        guard var urlComponents = URLComponents(string: baseURL) else {
            throw APIError.invalidURL
        }

        // Ensure path ends with /projects
        if !urlComponents.path.hasSuffix("/projects") {
            if urlComponents.path.hasSuffix("/") {
                urlComponents.path += "projects"
            } else {
                urlComponents.path += "/projects"
            }
        }

        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 30

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode)
        }

        do {
            let projectsResponse = try JSONDecoder().decode(ProjectsResponse.self, from: data)
            return projectsResponse.projects
        } catch {
            throw APIError.decodingError(error)
        }
    }

    /// Fetches projects from Supabase REST API
    private func fetchSupabaseProjects(baseURL: String) async throws -> [Project] {
        guard var urlComponents = URLComponents(string: baseURL) else {
            throw APIError.invalidURL
        }

        // Ensure path ends with /projects
        if !urlComponents.path.hasSuffix("/projects") {
            if urlComponents.path.hasSuffix("/") {
                urlComponents.path += "projects"
            } else {
                urlComponents.path += "/projects"
            }
        }

        // Select only needed fields and order by title
        urlComponents.queryItems = [
            URLQueryItem(name: "select", value: "id,title,url,created_at,updated_at"),
            URLQueryItem(name: "order", value: "title.asc")
        ]

        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 30

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode)
        }

        do {
            // Supabase returns a direct array
            let supabaseProjects = try JSONDecoder().decode([SupabaseProject].self, from: data)
            return supabaseProjects.compactMap { $0.toProject() }
        } catch {
            throw APIError.decodingError(error)
        }
    }
}
