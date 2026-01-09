import Foundation
import CoreSpotlight
import MobileCoreServices

/// Handles indexing projects for iOS Spotlight search
final class SpotlightIndexer {

    /// Domain identifier for all project items
    static let domainIdentifier = "com.projectexplorer.projects"

    /// Content type for project items
    static let contentType = UTType.item.identifier

    // MARK: - Indexing

    /// Indexes all projects for Spotlight search
    /// - Parameter projects: The projects to index
    static func indexProjects(_ projects: [Project]) {
        let items = projects.map { createSearchableItem(from: $0) }

        // Delete all existing items first, then add new ones
        CSSearchableIndex.default().deleteSearchableItems(
            withDomainIdentifiers: [domainIdentifier]
        ) { error in
            if let error = error {
                print("SpotlightIndexer: Error deleting items: \(error.localizedDescription)")
            }

            CSSearchableIndex.default().indexSearchableItems(items) { error in
                if let error = error {
                    print("SpotlightIndexer: Error indexing items: \(error.localizedDescription)")
                } else {
                    print("SpotlightIndexer: Indexed \(items.count) projects")
                }
            }
        }
    }

    /// Indexes a single project for Spotlight search
    /// - Parameter project: The project to index
    static func indexProject(_ project: Project) {
        let item = createSearchableItem(from: project)

        CSSearchableIndex.default().indexSearchableItems([item]) { error in
            if let error = error {
                print("SpotlightIndexer: Error indexing project: \(error.localizedDescription)")
            }
        }
    }

    /// Removes a project from the Spotlight index
    /// - Parameter projectId: The ID of the project to remove
    static func removeProject(withId projectId: String) {
        CSSearchableIndex.default().deleteSearchableItems(
            withIdentifiers: [projectId]
        ) { error in
            if let error = error {
                print("SpotlightIndexer: Error removing project: \(error.localizedDescription)")
            }
        }
    }

    /// Removes all projects from the Spotlight index
    static func removeAllProjects() {
        CSSearchableIndex.default().deleteSearchableItems(
            withDomainIdentifiers: [domainIdentifier]
        ) { error in
            if let error = error {
                print("SpotlightIndexer: Error removing all projects: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Private Helpers

    /// Creates a searchable item from a project
    private static func createSearchableItem(from project: Project) -> CSSearchableItem {
        let attributeSet = CSSearchableItemAttributeSet(contentType: .item)
        attributeSet.title = project.name
        attributeSet.contentDescription = project.description
        attributeSet.identifier = project.id
        attributeSet.relatedUniqueIdentifier = project.id

        // Add the open URL as a custom attribute
        attributeSet.contentURL = project.openURL

        // Make it appear as a document/app
        attributeSet.contentType = UTType.item.identifier

        let item = CSSearchableItem(
            uniqueIdentifier: project.id,
            domainIdentifier: domainIdentifier,
            attributeSet: attributeSet
        )

        // Set expiration far in the future (projects don't expire)
        item.expirationDate = Date.distantFuture

        return item
    }

    // MARK: - Continuation Handling

    /// Extracts a project ID from a Spotlight user activity
    /// - Parameter userActivity: The user activity from Spotlight
    /// - Returns: The project ID if found
    static func projectId(from userActivity: NSUserActivity) -> String? {
        guard userActivity.activityType == CSSearchableItemActionType else {
            return nil
        }
        return userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String
    }
}
