/* eslint-disable camelcase */
import queryString from "query-string";
import got from "got";

// const prefixUrl = process.env.ECOREADY_SERVICES_URL;
const prefixUrl = "https://ecoready-services.issel.ee.auth.gr";

const EcoReadyServicesWrapper = (accessKey, additionalHeaders = {}) => got.extend({
	prefixUrl,
	retry: { limit: 5, maxRetryAfter: 1000 },
	headers: {
		"User-Agent": "EcoReady Dashboard",
		Authorization: `Bearer ${accessKey}`,
		...additionalHeaders,
	},
});

const EcoReadyServicesApi = (accessKey, additionalHeaders = {}) => {
	const api = EcoReadyServicesWrapper(accessKey, additionalHeaders);
	return ({
		get: (path, searchParams) => api(path, { searchParams: queryString.stringify(searchParams) }).json(),
		post: (path, body) => api.post(path, { json: body }).json(),
		put: (path, body) => api.put(path, { json: body }).json(),
		delete: (path) => api.delete(path).json(),
	});
};

// Collection Management
const getCollections = (organization, project, accessKey) => EcoReadyServicesApi(accessKey).get(`api/organizations/${organization}/projects/${project}/collections`);
const createCollection = (organization, project, accessKey, body) => EcoReadyServicesApi(accessKey).post(`api/organizations/${organization}/projects/${project}/collections`, body);
const updateCollection = (organization, project, collection, accessKey, body) => EcoReadyServicesApi(accessKey).put(`api/organizations/${organization}/projects/${project}/collections/${collection}`, body);
const deleteCollection = (organization, project, collection, accessKey) => EcoReadyServicesApi(accessKey).delete(`api/organizations/${organization}/projects/${project}/collections/${collection}`);
const getCollectionInfo = (organization, project, collection, accessKey) => EcoReadyServicesApi(accessKey).get(`api/organizations/${organization}/projects/${project}/collections/${collection}`);

// Collection Data Management
const getData = (organization, project, collection, accessKey, params = {}) => {
	const parsedParams = JSON.parse(params); // Parse search params into an object
	const { filters, order_by, ...restParams } = parsedParams;
	return EcoReadyServicesApi(accessKey).get(
		`api/organizations/${organization}/projects/${project}/collections/${collection}/get_data`,
		{
			...restParams,
			filters: JSON.stringify(filters),
			order_by: JSON.stringify(order_by),
		},
	);
};

const createData = (organization, project, collection, accessKey, body) => EcoReadyServicesApi(accessKey).post(`api/organizations/${organization}/projects/${project}/collections/${collection}/send_data`, body);
const getDataStatistics = (organization, project, collection, accessKey, params = {}) => {
	const parsedParams = JSON.parse(params); // Parse search params into an object
	const { filters, ...restParams } = parsedParams;
	return EcoReadyServicesApi(accessKey).get(
		`api/organizations/${organization}/projects/${project}/collections/${collection}/statistics`,
		{
			...restParams,
			filters: JSON.stringify(filters),
			// group_by: JSON.stringify(groupBy),
		},
	);
};

// Live Data Management
const createLiveDataConsumer = (organization, project, collection, accessKey) => EcoReadyServicesApi(accessKey).post(`api/organizations/${organization}/projects/${project}/collections/${collection}/live_data`);
const deleteLiveDataConsumer = (organization, project, collection, accessKey) => EcoReadyServicesApi(accessKey).delete(`api/organizations/${organization}/projects/${project}/collections/${collection}/live_data`);

const CollectionManagement = {
	getCollections,
	createCollection,
	updateCollection,
	deleteCollection,
	getCollectionInfo,
};

const CollectionDataManagement = {
	getData,
	createData,
	getDataStatistics,
};

const LiveDataManagement = {
	createLiveDataConsumer,
	deleteLiveDataConsumer,
};

export {
	EcoReadyServicesWrapper,
	EcoReadyServicesApi,
	CollectionManagement,
	CollectionDataManagement,
	LiveDataManagement,
};
