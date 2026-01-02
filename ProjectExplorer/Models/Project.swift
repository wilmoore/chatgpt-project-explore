import Foundation

/// Represents a ChatGPT project from the Project Index API
struct Project: Codable, Identifiable, Equatable {
    /// Unique identifier for the project
    let id: String

    /// Display name of the project
    let name: String

    /// URL to open the project in ChatGPT
    let openURL: URL

    /// Optional description of the project
    let description: String?

    /// When the project was created
    let createdAt: Date?

    /// When the project was last updated
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case openURL = "open_url"
        case description
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)

        // Handle open_url as string and convert to URL
        let urlString = try container.decode(String.self, forKey: .openURL)
        guard let url = URL(string: urlString) else {
            throw DecodingError.dataCorruptedError(
                forKey: .openURL,
                in: container,
                debugDescription: "Invalid URL: \(urlString)"
            )
        }
        openURL = url

        description = try container.decodeIfPresent(String.self, forKey: .description)

        // Handle date decoding with ISO8601
        if let createdAtString = try container.decodeIfPresent(String.self, forKey: .createdAt) {
            createdAt = ISO8601DateFormatter().date(from: createdAtString)
        } else {
            createdAt = nil
        }

        if let updatedAtString = try container.decodeIfPresent(String.self, forKey: .updatedAt) {
            updatedAt = ISO8601DateFormatter().date(from: updatedAtString)
        } else {
            updatedAt = nil
        }
    }

    init(
        id: String,
        name: String,
        openURL: URL,
        description: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.openURL = openURL
        self.description = description
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// Response wrapper for projects list endpoint
struct ProjectsResponse: Codable {
    let projects: [Project]
}
