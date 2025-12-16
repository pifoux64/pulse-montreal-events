import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://pulse-mtl.vercel.app' 
      : 'http://localhost:3000'

    // Récupérer les événements récents
    const eventsResponse = await fetch(`${baseUrl}/api/events-simple?limit=50&sort=date`, {
      headers: {
        'User-Agent': 'Pulse RSS Generator',
      },
    })
    
    if (!eventsResponse.ok) {
      throw new Error('Failed to fetch events')
    }

    const events = await eventsResponse.json()
    const lastBuildDate = new Date().toUTCString()

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pulse Montreal - Événements</title>
    <description>Les derniers événements culturels, sportifs et festifs à Montréal</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
    <language>fr-CA</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Pulse Montreal Events Platform</generator>
    <image>
      <url>${baseUrl}/Pulse_Logo.png</url>
      <title>Pulse Montreal</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    ${events.slice(0, 20).map((event: any) => {
      const eventDate = new Date(event.startAt || event.date).toUTCString()
      const description = event.description || event.title
      const venue = event.venue?.name || event.location || 'Lieu à déterminer'
      const price = event.priceMin ? `À partir de ${event.priceMin}${event.currency || 'CAD'}` : 'Gratuit'
      
      return `
    <item>
      <title><![CDATA[${event.title}]]></title>
      <description><![CDATA[
        <p><strong>📅 Date:</strong> ${new Date(event.startAt || event.date).toLocaleDateString('fr-CA', {
          weekday: 'long',
          year: 'numeric',
          timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p><strong>📍 Lieu:</strong> ${venue}</p>
        <p><strong>💰 Prix:</strong> ${price}</p>
        <p><strong>🏷️ Catégorie:</strong> ${event.category || 'Autre'}</p>
        ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.title}" style="max-width:300px;height:auto;margin:10px 0;" />` : ''}
        <p>${description.substring(0, 300)}${description.length > 300 ? '...' : ''}</p>
        ${event.tags && event.tags.length > 0 ? `<p><strong>Tags:</strong> ${event.tags.slice(0, 5).join(', ')}</p>` : ''}
      ]]></description>
      <link>${baseUrl}/evenement/${event.id}</link>
      <guid isPermaLink="true">${baseUrl}/evenement/${event.id}</guid>
      <pubDate>${eventDate}</pubDate>
      <category>${event.category || 'Événement'}</category>
      ${event.imageUrl ? `<enclosure url="${event.imageUrl}" type="image/jpeg" />` : ''}
    </item>`
    }).join('')}
  </channel>
</rss>`

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('RSS Generation Error:', error)
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Pulse Montreal - Erreur</title>
    <description>Erreur lors de la génération du flux RSS</description>
    <link>https://pulse-mtl.vercel.app</link>
  </channel>
</rss>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
        },
      }
    )
  }
}
