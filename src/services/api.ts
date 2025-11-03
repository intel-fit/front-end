/**
 * @deprecated 이 파일은 호환성을 위해 유지됩니다.
 * 새로운 코드는 다음을 사용하세요:
 * - import { authAPI } from '../services';
 * - import { apiRequest } from '../services';
 * 
 * 또는 직접:
 * - import { authAPI } from '../services/authAPI';
 * - import { apiRequest } from '../services/apiConfig';
 */

// 기존 코드 호환성을 위해 재export
export {authAPI} from './authAPI';
export {request as apiRequest} from './apiConfig';
export type {ApiResponse} from './apiConfig';


