/** types/trip.ts — الأنواع المشتركة بين الخادم والعميل. */

export type TripType = 'solo' | 'couple' | 'family' | 'friends' | 'business';
export type BudgetLevel = 'budget' | 'comfort' | 'luxury';
export type Pace = 'relaxed' | 'balanced' | 'packed';
export type StayStyle = 'hotel' | 'apartment' | 'resort' | 'boutique' | 'hostel';

export interface TripPreferences {
  destination: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  durationDays: number;
  travelers: number;
  tripType: TripType;
  budgetLevel: BudgetLevel;
  budgetAmount?: number | null;
  currency?: string;
  pace: Pace;
  stayStyle?: StayStyle;
  interests: string[];
  foodPreferences?: string[];
  accessibility?: string[];
  notes?: string;
}

export type CardCategory =
  | 'hotels'
  | 'flights'
  | 'restaurants'
  | 'experiences'
  | 'landmarks'
  | 'shopping';

export interface Flight {
  id: string; airline: string; from: string; to: string;
  departTime: string; arriveTime: string; durationMinutes: number;
  stops: number; cabin: 'economy' | 'premium' | 'business';
  price: number; currency: string; priceNote: string;
  bookingUrl: string; imageQuery: string;
}

export interface Hotel {
  id: string; name: string; area: string; rating: number;
  pricePerNight: number; currency: string; highlights: string[];
  whyItFits: string; mapUrl: string; bookingUrl: string; imageQuery: string;
}

export interface Restaurant {
  id: string; name: string; type: 'restaurant' | 'cafe' | 'street-food' | 'dessert';
  cuisine: string; priceLevel: number; mustTry: string; area: string;
  isHalalFriendly: boolean; mapUrl: string; imageQuery: string;
}

export interface Experience {
  id: string; title: string;
  category: 'adventure' | 'culture' | 'nature' | 'nightlife' | 'wellness' | 'family';
  durationHours: number; price: number; currency: string;
  description: string; bestTime: string; bookingUrl: string; imageQuery: string;
}

export interface Landmark {
  id: string; name: string;
  type: 'historic' | 'religious' | 'modern' | 'viewpoint' | 'museum';
  entryFee: number; currency: string; suggestedDuration: string;
  tip: string; mapUrl: string; imageQuery: string;
}

export interface Shopping {
  id: string; name: string; type: 'mall' | 'souq' | 'boutique-street' | 'outlet';
  knownFor: string; priceLevel: number; area: string; mapUrl: string; imageQuery: string;
}

export interface DayBlock {
  time: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  title: string; description: string;
  refType: 'hotel' | 'flight' | 'restaurant' | 'experience' | 'landmark' | 'shopping' | 'free';
  refId: string; estimatedCost: number; transitNote: string;
}

export interface TripDay { day: number; title: string; theme: string; blocks: DayBlock[] }

export interface Itinerary {
  meta: {
    title: string; destination: string; destinationEn: string; summary: string;
    durationDays: number; currency: string; estimatedTotalCost: number;
    bestTimeNote: string; tags: string[];
  };
  flights: Flight[];
  hotels: Hotel[];
  restaurants: Restaurant[];
  experiences: Experience[];
  landmarks: Landmark[];
  shopping: Shopping[];
  days: TripDay[];
  budgetBreakdown: {
    flights: number; stay: number; food: number;
    activities: number; shopping: number; transport: number;
  };
  practicalTips: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}
