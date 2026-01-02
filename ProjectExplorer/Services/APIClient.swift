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
}

/// Client for interacting with the Project Index API
actor APIClient {

    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    /// Validates the API by calling the /meta endpoint
    /// - Parameter baseURL: The base URL of the API
    /// - Returns: The meta response if successful
    func validateAPI(baseURL: String) async throws -> APIMetaResponse {
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

        do {
            let meta = try JSONDecoder().decode(APIMetaResponse.self, from: data)
            return meta
        } catch {
            throw APIError.decodingError(error)
        }
    }
}
