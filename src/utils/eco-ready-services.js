/* eslint-disable camelcase */
import queryString from "query-string";
import got from "got";

import { getIds } from "./id-utils.js";

const prefixUrl = "https://ecoready-services.issel.ee.auth.gr";

const EcoReadyServicesWrapper = (accessKey, additionalHeaders = {}) => got.extend({
	prefixUrl,
	retry: { limit: 5, maxRetryAfter: 1000 },
	headers: {
		"User-Agent": "EcoReady Dashboard",
		"X-API-Key": accessKey,
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
const getCollections = (orgName, projName, accessKey) => {
	const { orgId, projId } = getIds(orgName, projName);
	return EcoReadyServicesApi(accessKey).get(`api/v1/organizations/${orgId}/projects/${projId}/collections`);
};

const createCollection = (orgName, projName, accessKey, body) => {
	const { orgId, projId } = getIds(orgName, projName);
	return EcoReadyServicesApi(accessKey).post(`api/v1/organizations/${orgId}/projects/${projId}/collections`, body);
};

const updateCollection = (orgName, projName, collName, accessKey, body) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	return EcoReadyServicesApi(accessKey).put(`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}`, body);
};

const deleteCollection = (orgName, projName, collName, accessKey) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	return EcoReadyServicesApi(accessKey).delete(`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}`);
};

const getCollectionInfo = (orgName, projName, collName, accessKey) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	return EcoReadyServicesApi(accessKey).get(`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}`);
};

// Collection Data Management
const getData = (orgName, projName, collName, accessKey, params = {}) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	const parsedParams = JSON.parse(params);
	const { filters, order_by, ...restParams } = parsedParams;

	return EcoReadyServicesApi(accessKey).get(
		`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}/get_data`,
		{
			...restParams,
			filters: JSON.stringify(filters),
			order_by: JSON.stringify(order_by),
		},
	);
};

const createData = (orgName, projName, collName, accessKey, body) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	return EcoReadyServicesApi(accessKey).post(
		`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}/send_data`,
		body,
	);
};

const getDataStatistics = (orgName, projName, collName, accessKey, params = {}) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	const parsedParams = JSON.parse(params);
	const { filters, ...restParams } = parsedParams;

	return EcoReadyServicesApi(accessKey).get(
		`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}/statistics`,
		{
			...restParams,
			filters: JSON.stringify(filters),
		},
	);
};

// Live Data Management
const createLiveDataConsumer = (orgName, projName, collName, accessKey) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	return EcoReadyServicesApi(accessKey).post(
		`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}/live_data`,
	);
};

const deleteLiveDataConsumer = (orgName, projName, collName, accessKey) => {
	const { orgId, projId, collId } = getIds(orgName, projName, collName);
	return EcoReadyServicesApi(accessKey).delete(
		`api/v1/organizations/${orgId}/projects/${projId}/collections/${collId}/live_data`,
	);
};

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
