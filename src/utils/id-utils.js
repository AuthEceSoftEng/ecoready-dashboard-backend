// id-utils.js

/**
 * Gets IDs for organization, project, and collection from their names
 * @param {string} orgName - Organization name
 * @param {string|null} projName - Project name (optional)
 * @param {string|null} collName - Collection name (optional)
 * @returns {Object} Object containing the requested IDs
 */
export function getIds(orgName, projName = null, collName = null) {
    // Load hierarchy from environment variable
    const hierarchyData = JSON.parse(process.env.HIERARCHY_DATA);
    
    // Check organization
    const org = hierarchyData.organizations[orgName];
    if (!org) throw new Error(`Organization ${orgName} not found`);
    const result = { orgId: org.id };
    
    // If only organization is requested, return early
    if (!projName) return result;
    
    // Check project
    const proj = org.projects[projName];
    if (!proj) throw new Error(`Project ${projName} not found in organization ${orgName}`);
    result.projId = proj.id;
    
    // If only organization and project are requested, return early
    if (!collName) return result;
    
    // Check collection
    const coll = proj.collections[collName];
    if (!coll) throw new Error(`Collection ${collName} not found in project ${projName}`);
    result.collId = coll.id;
    
    return result;
  }
  
  export default getIds;