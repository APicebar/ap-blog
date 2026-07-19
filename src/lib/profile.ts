export type SectionId = 'home' | 'blog' | 'projects';

interface SectionLink {
	kind: 'section';
	label: string;
	section: Exclude<SectionId, 'home'>;
	href: '/blog' | '/projects';
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
	tagline: '写代码、写字，偶尔画点画。',
	links: [
		{
			kind: 'section',
			label: '博客',
			section: 'blog',
			href: '/blog',
			icon: '📝',
			blurb: '最近写的一些东西'
		},
		{
			kind: 'section',
			label: '项目',
			section: 'projects',
			href: '/projects',
			icon: '🧪',
			blurb: '做过的小玩具'
		},
		{ kind: 'external', label: 'GitHub', href: 'https://github.com', icon: '🐙' },
		{ kind: 'external', label: '邮箱', href: 'mailto:hi@example.com', icon: '✉️' }
	] satisfies ProfileLink[]
};
