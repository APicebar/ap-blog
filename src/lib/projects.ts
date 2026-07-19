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
		icon: '🛰️',
		name: 'orbit-toys',
		desc: '一堆关于轨道力学的交互小实验，Canvas 绘制。',
		tech: ['Svelte', 'Canvas']
	},
	{
		icon: '📦',
		name: 'md-garden',
		desc: '把 Markdown 文件夹直接变成静态博客的构建脚本。',
		tech: ['Node', 'Markdown']
	},
	{
		icon: '🎛️',
		name: 'knob-ui',
		desc: '拟物风格的旋钮组件库，支持触摸拖动和滚轮。',
		tech: ['Svelte', 'CSS']
	}
];
