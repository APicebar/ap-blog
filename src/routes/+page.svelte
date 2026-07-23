<script lang="ts">
	import { SITE_DESCRIPTION, pageTitle } from '$lib/site';
</script>

<svelte:head>
	<title>{pageTitle()}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta property="og:title" content={pageTitle()} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://apice.bar/og-image.png" />
</svelte:head>
