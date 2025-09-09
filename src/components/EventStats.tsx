'use client';

import { useMemo } from 'react';
import { Event } from '@/types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Star,
  Heart,
  Eye,
  Share2
} from 'lucide-react';

interface EventStatsProps {
  events: Event[];
  className?: string;
}

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

const EventStats = ({ events, className = "" }: EventStatsProps) => {
  const stats = useMemo(() => {
    if (!events.length) return [];

    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.startDate) > now);
    const pastEvents = events.filter(event => new Date(event.startDate) <= now);
    const freeEvents = events.filter(event => event.price.isFree);
    const paidEvents = events.filter(event => !event.price.isFree);
    
    const totalCapacity = events.reduce((sum, event) => sum + (event.maxCapacity || 0), 0);
    const totalAttendees = events.reduce((sum, event) => sum + event.currentAttendees, 0);
    const avgPrice = paidEvents.length > 0 
      ? paidEvents.reduce((sum, event) => sum + event.price.amount, 0) / paidEvents.length 
      : 0;

    const cities = new Set(events.map(event => event.location.city));
    const categories = new Set(events.map(event => event.category));

    const mostPopularCategory = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(mostPopularCategory)
      .sort(([,a], [,b]) => b - a)[0];

    return [
      {
        label: 'Total événements',
        value: events.length,
        icon: <Calendar className="w-5 h-5" />,
        color: 'bg-blue-500',
        description: 'Nombre total d\'événements'
      },
      {
        label: 'À venir',
        value: upcomingEvents.length,
        icon: <Clock className="w-5 h-5" />,
        color: 'bg-green-500',
        description: 'Événements futurs'
      },
      {
        label: 'Villes',
        value: cities.size,
        icon: <MapPin className="w-5 h-5" />,
        color: 'bg-purple-500',
        description: 'Nombre de villes'
      },
      {
        label: 'Catégories',
        value: categories.size,
        icon: <Star className="w-5 h-5" />,
        color: 'bg-yellow-500',
        description: 'Types d\'événements'
      },
      {
        label: 'Gratuits',
        value: freeEvents.length,
        icon: <Heart className="w-5 h-5" />,
        color: 'bg-red-500',
        description: 'Événements gratuits'
      },
      {
        label: 'Prix moyen',
        value: `$${avgPrice.toFixed(0)}`,
        icon: <DollarSign className="w-5 h-5" />,
        color: 'bg-emerald-500',
        description: 'Prix moyen des événements payants'
      },
      {
        label: 'Capacité totale',
        value: totalCapacity.toLocaleString(),
        icon: <Users className="w-5 h-5" />,
        color: 'bg-indigo-500',
        description: 'Nombre total de places'
      },
      {
        label: 'Taux de remplissage',
        value: totalCapacity > 0 ? `${Math.round((totalAttendees / totalCapacity) * 100)}%` : '0%',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-orange-500',
        description: 'Pourcentage de places occupées'
      }
    ] as StatItem[];
  }, [events]);

  const insights = useMemo(() => {
    if (!events.length) return [];

    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.startDate) > now);
    const thisWeek = upcomingEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate <= weekFromNow;
    });

    const insights = [];

    if (thisWeek.length > 0) {
      insights.push({
        type: 'info',
        text: `${thisWeek.length} événement(s) cette semaine`,
        icon: <Calendar className="w-4 h-4" />
      });
    }

    const freeEvents = events.filter(event => event.price.isFree);
    if (freeEvents.length > 0) {
      insights.push({
        type: 'success',
        text: `${freeEvents.length} événement(s) gratuit(s) disponible(s)`,
        icon: <Heart className="w-4 h-4" />
      });
    }

    const highDemandEvents = events.filter(event => 
      event.maxCapacity && event.currentAttendees / event.maxCapacity > 0.8
    );
    if (highDemandEvents.length > 0) {
      insights.push({
        type: 'warning',
        text: `${highDemandEvents.length} événement(s) presque complet(s)`,
        icon: <Users className="w-4 h-4" />
      });
    }

    return insights;
  }, [events]);

  if (!events.length) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun événement disponible pour les statistiques</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistiques principales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statistiques des événements
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {stat.label}
              </div>
              {stat.description && (
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Insights et alertes */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Insights et alertes
          </h3>
          
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                  insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className={`${
                  insight.type === 'success' ? 'text-green-600' :
                  insight.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {insight.icon}
                </div>
                <span className={`text-sm ${
                  insight.type === 'success' ? 'text-green-800' :
                  insight.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {insight.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Répartition par catégorie */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Répartition par catégorie
        </h3>
        
        <div className="space-y-3">
          {Object.entries(
            events.reduce((acc, event) => {
              acc[event.category] = (acc[event.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          )
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => {
              const percentage = Math.round((count / events.length) * 100);
              const color = getCategoryColor(category);
              
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${color}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Événements populaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Événements les plus populaires
        </h3>
        
        <div className="space-y-3">
          {events
            .filter(event => event.maxCapacity && event.currentAttendees > 0)
            .sort((a, b) => {
              const ratioA = a.currentAttendees / (a.maxCapacity || 1);
              const ratioB = b.currentAttendees / (b.maxCapacity || 1);
              return ratioB - ratioA;
            })
            .slice(0, 5)
            .map((event, index) => {
              const ratio = event.maxCapacity ? event.currentAttendees / event.maxCapacity : 0;
              const percentage = Math.round(ratio * 100);
              
              return (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' :
                      'bg-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {event.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.location.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {event.currentAttendees}/{event.maxCapacity}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage}% rempli
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Fonction utilitaire pour obtenir la couleur d'une catégorie
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'musique': 'bg-red-500',
    'art': 'bg-purple-500',
    'sport': 'bg-blue-500',
    'famille': 'bg-orange-500',
    'culture': 'bg-teal-500',
    'gastronomie': 'bg-amber-500',
    'théâtre': 'bg-pink-500',
    'cinéma': 'bg-indigo-500',
    'festival': 'bg-yellow-500',
  };
  return colors[category.toLowerCase()] || 'bg-gray-500';
};

export default EventStats;

