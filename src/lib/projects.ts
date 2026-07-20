// 项目展示数据：硬编码在前端，列表页按批懒渲染（每批 PROJECTS_CHUNK_SIZE 个）
export interface Project {
	icon: string;
	name: string;
	desc: string;
	tech: string[];
}

/** 项目列表每批渲染的数量 */
export const PROJECTS_CHUNK_SIZE = 6;

export const projects: Project[] = [
	{
		icon: '🤖',
		name: 'luogubot',
		desc: '给搞 OI 的玩的 bot，在 QQ 内查询多个算竞网站的数据。已弃坑。',
		tech: ['Python']
	}
];
