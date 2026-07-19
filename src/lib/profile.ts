// 'other' 用于 /、/blog、/projects 之外的路径（如 404 错误页）：卡片呈导航栏形态，但不高亮任何导航项
export type SectionId = 'home' | 'blog' | 'projects' | 'about' | 'other';

interface SectionLink {
	kind: 'section';
	label: string;
	section: Exclude<SectionId, 'home'>;
	href: '/blog' | '/projects' | '/blog/about-me';
	icon: string;
	blurb: string;
}

interface ExternalLink {
	kind: 'external';
	label: string;
	href: string;
	icon: string;
}

export type ProfileLink = SectionLink | ExternalLink;

export const profile = {
	avatar: '🦊',
	name: 'APicebar',
	tagline: '- the miracle in our hands -',
	links: [
		{
			kind: 'section',
			label: '关于我',
			section: 'about',
			href: '/blog/about-me',
			icon: '❓',
			blurb: '我是谁？'
		},
		{
			kind: 'section',
			label: '博客',
			section: 'blog',
			href: '/blog',
			icon: '📝',
			blurb: '随便写写'
		},
		{
			kind: 'section',
			label: '项目',
			section: 'projects',
			href: '/projects',
			icon: '🧪',
			blurb: '做过的小玩具'
		},
		{ kind: 'external', label: 'GitHub', href: 'https://github.com/APicebar', icon: '🐙' },
		{ kind: 'external', label: '邮箱', href: 'mailto:apicebar@icloud.com', icon: '✉️' }
	] satisfies ProfileLink[]
};
