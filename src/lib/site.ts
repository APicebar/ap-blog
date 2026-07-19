// 站点级元信息：站点名、站点描述与页面标题拼装，各页面 <svelte:head> 统一从这里取
export const SITE_NAME = '- ovo? -';

/** 站点描述：用于 meta description 与 Open Graph */
export const SITE_DESCRIPTION = '写代码、写字，偶尔画点画的个人博客。';

/** 拼装页面标题：有栏目/文章名时作为前缀，否则只用站点名 */
export function pageTitle(name?: string): string {
	return name ? `${name} ${SITE_NAME}` : SITE_NAME;
}
