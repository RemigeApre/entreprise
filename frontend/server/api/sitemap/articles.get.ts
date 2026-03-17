export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const directusUrl = config.directusUrl || 'http://directus:8055'

  try {
    const res = await $fetch<{ data: { id: string; date_publication: string | null }[] }>(
      `${directusUrl}/items/articles?filter[statut][_eq]=publie&filter[date_publication][_lte]=$NOW&fields=id,date_publication&limit=500`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    return (res.data || []).map(article => ({
      loc: `/articles/${article.id}`,
      lastmod: article.date_publication ?? undefined,
      changefreq: 'monthly',
      priority: 0.6
    }))
  } catch {
    return []
  }
})
