/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Citeproc Typings
 * CVM-Role:        Types
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Contains the types for Citeproc.js, since these are not (yet)
 *                  added to the types repository.
 *
 * END HEADER
 */

/**
 * Cite-items describe a specific reference to a bibliographic item. The fields
 * that a cite-item may contain depend on its context. In a citation, cite-items
 * listed as part of the citationItems array provide only pinpoint, descriptive,
 * and text-suppression fields.
 */
interface CiteItem {
    /**
     * The only required field: Contains a citation key with which the engine can
     * request the full bibliographic information from the registry.
     */
    id: string
    /**
     * A string identifying a page number or other pinpoint location or range
     * within the resource.
     */
    locator?: string
    /**
     * A label type, indicating whether the locator is to a page, a chapter, or
     * other subdivision of the target resource. Valid labels are defined in the
     * CSL specification.
     */
    label?: string
    /**
     * If true, author names will not be included in the citation output for this
     * cite.
     */
    'suppress-author'?: boolean
    /**
     * If true, only the author name will be included in the citation output for
     * this cite – this optional parameter provides a means for certain demanding
     * styles that require the processor output to be divided between the main
     * text and a footnote. (See the section Partial suppression of citation
     * content under Running the Processor :: Dirty Tricks for more details.)
     */
    'author-only'?: boolean
    /**
     * A string to print before this cite item.
     */
    prefix?: string
    /**
     * A string to print after this cite item.
     */
    suffix?: string
}
