import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Récupérer les favoris de l'utilisateur
    // TODO: Remplacer par vraie requête DB quand Prisma sera connecté
    const mockFavorites = [
      {
        id: '1',
        title: 'Festival Jazz de Montréal',
        description: 'Le plus grand festival de jazz au monde',
        startAt: '2025-01-20T20:00:00Z',
        endAt: '2025-01-20T23:00:00Z',
        venue: { name: 'Place des Arts', address: '175 Rue Sainte-Catherine O, Montréal' },
        organizer: { displayName: 'Festival International de Jazz de Montréal' },
        url: 'https://pulse-mtl.vercel.app/evenement/1',
      },
      {
        id: '2', 
        title: 'Exposition Art Contemporain',
        description: 'Découvrez les œuvres des artistes émergents',
        startAt: '2025-01-25T14:00:00Z',
        endAt: '2025-01-25T18:00:00Z',
        venue: { name: 'Musée des Beaux-Arts', address: '1380 Rue Sherbrooke O, Montréal' },
        organizer: { displayName: 'MBAM' },
        url: 'https://pulse-mtl.vercel.app/evenement/2',
      },
    ]

    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    // Générer le contenu ICS
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pulse Montreal//Favoris//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Mes Favoris - Pulse Montreal',
      'X-WR-CALDESC:Mes événements favoris depuis Pulse Montreal',
      'X-WR-TIMEZONE:America/Montreal',
      ...mockFavorites.map(event => [
        'BEGIN:VEVENT',
        `UID:pulse-event-${event.id}@pulse-mtl.vercel.app`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${new Date(event.startAt).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${new Date(event.endAt).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}\\n\\nOrganisé par: ${event.organizer.displayName}\\n\\nPlus d'infos: ${event.url}`,
        `LOCATION:${event.venue.name}, ${event.venue.address}`,
        `URL:${event.url}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        `ORGANIZER;CN=${event.organizer.displayName}:mailto:noreply@pulse-mtl.vercel.app`,
        'END:VEVENT',
      ]).flat(),
      'END:VCALENDAR',
    ].join('\r\n')

    const filename = `pulse-favoris-${session.user.email.split('@')[0]}-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}.ics`

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('ICS Export Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
