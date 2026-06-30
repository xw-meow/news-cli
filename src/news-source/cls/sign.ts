import { createHash } from 'node:crypto';

type ParamValue = string | number | boolean | undefined | null;

/**
 * 财联社 API 签名计算：
 * sign = MD5( SHA1( 按 key 排序后的 queryString ) )
 * 无 secret key，纯嵌套哈希。
 * 参数按 Object.keys().sort() 默认字典序排序，
 * 只处理 string/number/boolean 类型，忽略 null/undefined。
 */
export function generateSign(params: Record<string, ParamValue>): string {
	const sortedKeys = Object.keys(params)
		.filter((key) => {
			const val = params[key];
			return val !== undefined && val !== null;
		})
		.sort();

	const queryString = sortedKeys
		.map((key) => `${key}=${encodeURIComponent(String(params[key]))}`)
		.join('&');

	const sha1 = createHash('sha1').update(queryString).digest('hex');
	const md5 = createHash('md5').update(sha1).digest('hex');
	return md5;
}
