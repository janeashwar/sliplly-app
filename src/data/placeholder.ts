// Placeholder data for Sliplly — Duty Slip Management App

export interface Trip {
  id: string;
  title?: string;
  from?: string;
  to?: string;
  date?: string;
  time?: string;
  status: 'INITIATED' | 'ASSIGNED' | 'ON_DUTY' | 'COMPLETED' | 'FINALIZE_CHARGES' | 'CANCELLED';
  amount?: number;
  distance?: string;
  duration?: string;
  vehicle?: string;
  driver?: string;
  guestName?: string;
  phone?: string;
  // API fields
  guestPhone?: string;
  guestContact?: string;
  pickupLocation?: string;
  dropLocation?: string;
  startDate?: string;
  endDate?: string;
  totalKm?: number;
  totalDistance?: number;
  totalAmount?: number;
  tripCode?: string;
  driverName?: string;
  assignedDriver?: { id: string; name: string; phone?: string } | string;
  assignedVehicle?: { id: string; name: string; registrationNo: string } | string;
  [key: string]: any;
}

export interface Booking {
  id: string;
  tripId?: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  passengers: number;
  vehicleType: string;
  notes: string;
  status: 'draft' | 'submitted' | 'confirmed';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'trip' | 'maintenance' | 'meeting' | 'reminder';
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tripCount: number;
  totalSpent: number;
  lastTripDate: string;
  company?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: 'Sedan' | 'SUV' | 'Innova' | 'Tempo';
  status: 'Active' | 'Maintenance' | 'Inactive';
  assignedDriver?: string;
  tripCount: number;
  lastServiceDate: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'Available' | 'On Trip' | 'Off Duty';
  rating: number;
  assignedVehicle?: string;
  tripCount: number;
  joinDate: string;
}

// Dashboard stats
export const dashboardStats = {
  totalTrips: 142,
  activeTrips: 3,
  totalRevenue: 284500,
  pendingPayments: 12400,
  completionRate: 94.7,
  avgTripDuration: '2h 15m',
  monthlyTrips: [
    { month: 'Jan', count: 18 },
    { month: 'Feb', count: 22 },
    { month: 'Mar', count: 15 },
    { month: 'Apr', count: 28 },
    { month: 'May', count: 32 },
    { month: 'Jun', count: 27 },
  ],
  recentActivity: [
    { id: '1', action: 'Trip completed', detail: 'Mumbai → Pune', time: '2h ago' },
    { id: '2', action: 'Payment received', detail: '₹4,200', time: '3h ago' },
    { id: '3', action: 'New booking', detail: 'Delhi → Jaipur', time: '5h ago' },
    { id: '4', action: 'Trip started', detail: 'Bangalore → Mysore', time: '6h ago' },
  ],
};

// Guests data
export const guests: Guest[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    phone: '9988776655',
    email: 'priya.sharma@email.com',
    tripCount: 12,
    totalSpent: 48500,
    lastTripDate: '2026-06-14',
    company: 'TechCorp India',
  },
  {
    id: '2',
    name: 'Arun Mehta',
    phone: '9876543210',
    tripCount: 8,
    totalSpent: 32000,
    lastTripDate: '2026-06-13',
  },
  {
    id: '3',
    name: 'Deepa Nair',
    phone: '7766554433',
    email: 'deepa.n@email.com',
    tripCount: 5,
    totalSpent: 18500,
    lastTripDate: '2026-06-12',
    company: 'Infosys',
  },
  {
    id: '4',
    name: 'Vikram Reddy',
    phone: '8877665544',
    tripCount: 15,
    totalSpent: 62000,
    lastTripDate: '2026-06-15',
  },
  {
    id: '5',
    name: 'Rohan Gupta',
    phone: '6655443322',
    email: 'rohan.gupta@company.in',
    tripCount: 3,
    totalSpent: 9800,
    lastTripDate: '2026-06-10',
    company: 'Wipro',
  },
  {
    id: '6',
    name: 'Sneha Iyer',
    phone: '5544332211',
    tripCount: 7,
    totalSpent: 28400,
    lastTripDate: '2026-06-11',
  },
  {
    id: '7',
    name: 'Kavita Joshi',
    phone: '9988112233',
    email: 'kavita.j@email.com',
    tripCount: 10,
    totalSpent: 41200,
    lastTripDate: '2026-06-14',
    company: 'TCS',
  },
  {
    id: '8',
    name: 'Amit Patel',
    phone: '9123456789',
    tripCount: 6,
    totalSpent: 22800,
    lastTripDate: '2026-06-09',
  },
  {
    id: '9',
    name: 'Neha Singh',
    phone: '9234567890',
    email: 'neha.singh@startup.io',
    tripCount: 4,
    totalSpent: 15600,
    lastTripDate: '2026-06-08',
    company: 'Flipkart',
  },
  {
    id: '10',
    name: 'Rajesh Khanna',
    phone: '9345678901',
    tripCount: 9,
    totalSpent: 37500,
    lastTripDate: '2026-06-13',
  },
];

// Vehicles data
export const vehicles: Vehicle[] = [
  {
    id: '1',
    registrationNumber: 'MH 02 AB 1234',
    name: 'Swift Dzire',
    type: 'Sedan',
    status: 'Active',
    assignedDriver: 'Rajesh Kumar',
    tripCount: 45,
    lastServiceDate: '2026-05-15',
  },
  {
    id: '2',
    registrationNumber: 'DL 01 CD 5678',
    name: 'Toyota Innova',
    type: 'Innova',
    status: 'Active',
    assignedDriver: 'Amit Singh',
    tripCount: 38,
    lastServiceDate: '2026-05-20',
  },
  {
    id: '3',
    registrationNumber: 'KA 03 EF 9012',
    name: 'Hyundai Creta',
    type: 'SUV',
    status: 'Active',
    assignedDriver: 'Suresh Babu',
    tripCount: 22,
    lastServiceDate: '2026-06-01',
  },
  {
    id: '4',
    registrationNumber: 'TN 04 GH 3456',
    name: 'Toyota Crysta',
    type: 'Innova',
    status: 'Maintenance',
    assignedDriver: undefined,
    tripCount: 31,
    lastServiceDate: '2026-06-10',
  },
  {
    id: '5',
    registrationNumber: 'MH 02 IJ 7890',
    name: 'Maruti Baleno',
    type: 'Sedan',
    status: 'Active',
    assignedDriver: 'Venkat Rao',
    tripCount: 19,
    lastServiceDate: '2026-05-28',
  },
  {
    id: '6',
    registrationNumber: 'RJ 14 KL 2345',
    name: 'Mahindra XUV700',
    type: 'SUV',
    status: 'Active',
    assignedDriver: 'Probir Das',
    tripCount: 14,
    lastServiceDate: '2026-06-05',
  },
  {
    id: '7',
    registrationNumber: 'KA 05 MN 6789',
    name: 'Force Traveller',
    type: 'Tempo',
    status: 'Inactive',
    assignedDriver: undefined,
    tripCount: 8,
    lastServiceDate: '2026-04-20',
  },
  {
    id: '8',
    registrationNumber: 'DL 03 OP 4567',
    name: 'Hyundai Verna',
    type: 'Sedan',
    status: 'Active',
    assignedDriver: 'Manoj Tiwari',
    tripCount: 27,
    lastServiceDate: '2026-06-08',
  },
  {
    id: '9',
    registrationNumber: 'MH 04 QR 8901',
    name: 'Toyota Fortuner',
    type: 'SUV',
    status: 'Maintenance',
    assignedDriver: undefined,
    tripCount: 16,
    lastServiceDate: '2026-06-12',
  },
  {
    id: '10',
    registrationNumber: 'TN 07 ST 1234',
    name: 'Tempo Traveller',
    type: 'Tempo',
    status: 'Active',
    assignedDriver: 'Kumar Rajan',
    tripCount: 11,
    lastServiceDate: '2026-05-30',
  },
];

// Drivers data
export const drivers: Driver[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    licenseNumber: 'MH-2024-0012345',
    status: 'Available',
    rating: 4.9,
    assignedVehicle: 'Swift Dzire',
    tripCount: 45,
    joinDate: '2024-03-15',
  },
  {
    id: '2',
    name: 'Amit Singh',
    phone: '9988776655',
    licenseNumber: 'DL-2023-0067890',
    status: 'On Trip',
    rating: 4.7,
    assignedVehicle: 'Toyota Innova',
    tripCount: 38,
    joinDate: '2023-11-20',
  },
  {
    id: '3',
    name: 'Suresh Babu',
    phone: '7766554433',
    licenseNumber: 'KA-2024-0023456',
    status: 'Available',
    rating: 4.8,
    assignedVehicle: 'Hyundai Creta',
    tripCount: 22,
    joinDate: '2024-01-10',
  },
  {
    id: '4',
    name: 'Venkat Rao',
    phone: '8877665544',
    licenseNumber: 'TN-2023-0034567',
    status: 'Off Duty',
    rating: 4.5,
    assignedVehicle: 'Maruti Baleno',
    tripCount: 19,
    joinDate: '2023-08-05',
  },
  {
    id: '5',
    name: 'Probir Das',
    phone: '9988112233',
    licenseNumber: 'RJ-2024-0045678',
    status: 'On Trip',
    rating: 4.6,
    assignedVehicle: 'Mahindra XUV700',
    tripCount: 14,
    joinDate: '2024-05-12',
  },
  {
    id: '6',
    name: 'Manoj Tiwari',
    phone: '9123456789',
    licenseNumber: 'DL-2024-0056789',
    status: 'Available',
    rating: 4.9,
    assignedVehicle: 'Hyundai Verna',
    tripCount: 27,
    joinDate: '2024-02-28',
  },
  {
    id: '7',
    name: 'Kumar Rajan',
    phone: '9234567890',
    licenseNumber: 'TN-2023-0067890',
    status: 'On Trip',
    rating: 4.4,
    assignedVehicle: 'Tempo Traveller',
    tripCount: 11,
    joinDate: '2023-12-15',
  },
  {
    id: '8',
    name: 'Santosh Yadav',
    phone: '9345678901',
    licenseNumber: 'KA-2024-0078901',
    status: 'Off Duty',
    rating: 4.3,
    assignedVehicle: undefined,
    tripCount: 6,
    joinDate: '2024-06-01',
  },
  {
    id: '9',
    name: 'Ravi Shankar',
    phone: '9456789012',
    licenseNumber: 'MH-2023-0089012',
    status: 'Available',
    rating: 4.7,
    assignedVehicle: undefined,
    tripCount: 33,
    joinDate: '2023-10-20',
  },
  {
    id: '10',
    name: 'Deepak Verma',
    phone: '9567890123',
    licenseNumber: 'DL-2024-0090123',
    status: 'Off Duty',
    rating: 4.2,
    assignedVehicle: undefined,
    tripCount: 9,
    joinDate: '2024-04-10',
  },
];

// Trips data — comprehensive for calendar coverage
export const trips: Trip[] = [
  // June 2026 trips
  {
    id: '1',
    title: 'Mumbai to Pune Express',
    from: 'Mumbai Central',
    to: 'Pune Station',
    date: '2026-06-14',
    time: '08:30',
    status: 'COMPLETED',
    amount: 4200,
    distance: '148 km',
    duration: '2h 45m',
    vehicle: 'Swift Dzire',
    driver: 'Rajesh Kumar',
    guestName: 'Arun Mehta',
    phone: '9876543210',
  },
  {
    id: '2',
    title: 'Delhi Corporate Transfer',
    from: 'IGI Airport T3',
    to: 'Connaught Place',
    date: '2026-06-14',
    time: '14:00',
    status: 'ON_DUTY',
    amount: 2800,
    distance: '22 km',
    duration: '45m',
    vehicle: 'Toyota Innova',
    driver: 'Amit Singh',
    guestName: 'Priya Sharma',
    phone: '9988776655',
  },
  {
    id: '3',
    title: 'Bangalore Airport Run',
    from: 'Electronic City',
    to: 'Kempegowda Airport',
    date: '2026-06-15',
    time: '06:00',
    status: 'ASSIGNED',
    amount: 1800,
    distance: '38 km',
    duration: '1h 10m',
    vehicle: 'Hyundai Creta',
    driver: 'Suresh Babu',
    guestName: 'Vikram Reddy',
    phone: '8877665544',
  },
  {
    id: '4',
    title: 'Chennai Outstation',
    from: 'T Nagar',
    to: 'Pondicherry',
    date: '2026-06-15',
    time: '07:00',
    status: 'ASSIGNED',
    amount: 6500,
    distance: '162 km',
    duration: '3h 20m',
    vehicle: 'Toyota Crysta',
    driver: 'Suresh Babu',
    guestName: 'Deepa Nair',
    phone: '7766554433',
  },
  {
    id: '5',
    title: 'Jaipur Heritage Tour',
    from: 'Jaipur Railway Stn',
    to: 'Amber Fort',
    date: '2026-06-16',
    time: '09:00',
    status: 'INITIATED',
    amount: 3200,
    distance: '45 km',
    duration: '1h 30m',
    vehicle: 'Mahindra XUV700',
    driver: 'Pending Assignment',
    guestName: 'Rohan Gupta',
    phone: '6655443322',
  },
  {
    id: '6',
    title: 'Hyderabad IT Corridor',
    from: 'Gachibowli',
    to: 'HITEC City',
    date: '2026-06-13',
    time: '18:30',
    status: 'CANCELLED',
    amount: 900,
    distance: '8 km',
    duration: '20m',
    vehicle: 'Maruti Baleno',
    driver: 'Was: Venkat Rao',
    guestName: 'Sneha Iyer',
    phone: '5544332211',
  },
  {
    id: '7',
    title: 'Kolkata Evening Transfer',
    from: 'Salt Lake Sector V',
    to: 'Howrah Station',
    date: '2026-06-14',
    time: '17:00',
    status: 'FINALIZE_CHARGES',
    amount: 1500,
    distance: '14 km',
    duration: '40m',
    vehicle: 'Hyundai Verna',
    driver: 'Probir Das',
    guestName: 'Kavita Joshi',
    phone: '9988112233',
  },
  {
    id: '8',
    title: 'Pune Local',
    from: 'Hinjewadi',
    to: 'Koregaon Park',
    date: '2026-06-17',
    time: '10:00',
    status: 'INITIATED',
    amount: 800,
    distance: '18 km',
    duration: '35m',
    vehicle: 'Pending',
    driver: 'Pending Assignment',
    guestName: 'Amit Patel',
    phone: '9123456789',
  },
  {
    id: '9',
    title: 'Delhi NCR Round Trip',
    from: 'Noida Sector 62',
    to: 'Gurgaon Cyber Hub',
    date: '2026-06-18',
    time: '09:30',
    status: 'ASSIGNED',
    amount: 3500,
    distance: '52 km',
    duration: '1h 40m',
    vehicle: 'Toyota Innova',
    driver: 'Amit Singh',
    guestName: 'Neha Singh',
    phone: '9234567890',
  },
  {
    id: '10',
    title: 'Bangalore City Tour',
    from: 'MG Road',
    to: 'Lalbagh Botanical',
    date: '2026-06-18',
    time: '14:00',
    status: 'INITIATED',
    amount: 1200,
    distance: '12 km',
    duration: '25m',
    vehicle: 'Pending',
    driver: 'Pending Assignment',
    guestName: 'Rajesh Khanna',
    phone: '9345678901',
  },
  {
    id: '11',
    title: 'Mumbai Airport Pickup',
    from: 'CSM Airport T2',
    to: 'Bandra West',
    date: '2026-06-19',
    time: '23:00',
    status: 'ASSIGNED',
    amount: 1800,
    distance: '12 km',
    duration: '40m',
    vehicle: 'Hyundai Verna',
    driver: 'Manoj Tiwari',
    guestName: 'Priya Sharma',
    phone: '9988776655',
  },
  {
    id: '12',
    title: 'Chennai Morning Run',
    from: 'Adyar',
    to: 'Sholinganallur',
    date: '2026-06-20',
    time: '07:30',
    status: 'COMPLETED',
    amount: 650,
    distance: '14 km',
    duration: '30m',
    vehicle: 'Maruti Baleno',
    driver: 'Venkat Rao',
    guestName: 'Deepa Nair',
    phone: '7766554433',
  },
  {
    id: '13',
    title: 'Jaipur Airport Drop',
    from: 'Jaipur City',
    to: 'Jaipur Airport',
    date: '2026-06-20',
    time: '05:00',
    status: 'ON_DUTY',
    amount: 1100,
    distance: '15 km',
    duration: '30m',
    vehicle: 'Mahindra XUV700',
    driver: 'Probir Das',
    guestName: 'Rohan Gupta',
    phone: '6655443322',
  },
  {
    id: '14',
    title: 'Hyderabad Corporate',
    from: 'HITEC City',
    to: 'Secunderabad',
    date: '2026-06-21',
    time: '11:00',
    status: 'INITIATED',
    amount: 1400,
    distance: '20 km',
    duration: '45m',
    vehicle: 'Pending',
    driver: 'Pending Assignment',
    guestName: 'Sneha Iyer',
    phone: '5544332211',
  },
  {
    id: '15',
    title: 'Kolkata Airport Transfer',
    from: 'Park Street',
    to: 'Kolkata Airport',
    date: '2026-06-22',
    time: '16:00',
    status: 'ASSIGNED',
    amount: 1600,
    distance: '22 km',
    duration: '50m',
    vehicle: 'Toyota Crysta',
    driver: 'Kumar Rajan',
    guestName: 'Kavita Joshi',
    phone: '9988112233',
  },
  {
    id: '16',
    title: 'Pune Mumbai Express',
    from: 'Pune Station',
    to: 'Mumbai Central',
    date: '2026-06-22',
    time: '06:30',
    status: 'FINALIZE_CHARGES',
    amount: 4500,
    distance: '148 km',
    duration: '2h 45m',
    vehicle: 'Swift Dzire',
    driver: 'Rajesh Kumar',
    guestName: 'Arun Mehta',
    phone: '9876543210',
  },
  {
    id: '17',
    title: 'Delhi Sightseeing',
    from: 'Hotel Taj',
    to: 'Red Fort',
    date: '2026-06-23',
    time: '10:00',
    status: 'INITIATED',
    amount: 2200,
    distance: '30 km',
    duration: '3h',
    vehicle: 'Pending',
    driver: 'Pending Assignment',
    guestName: 'Vikram Reddy',
    phone: '8877665544',
  },
  {
    id: '18',
    title: 'Bangalore Night Ride',
    from: 'Whitefield',
    to: 'Koramangala',
    date: '2026-06-24',
    time: '21:00',
    status: 'ASSIGNED',
    amount: 700,
    distance: '16 km',
    duration: '35m',
    vehicle: 'Hyundai Creta',
    driver: 'Suresh Babu',
    guestName: 'Amit Patel',
    phone: '9123456789',
  },
  {
    id: '19',
    title: 'Chennai Beach Trip',
    from: 'T Nagar',
    to: 'Marina Beach',
    date: '2026-06-25',
    time: '16:00',
    status: 'COMPLETED',
    amount: 400,
    distance: '8 km',
    duration: '20m',
    vehicle: 'Maruti Baleno',
    driver: 'Venkat Rao',
    guestName: 'Neha Singh',
    phone: '9234567890',
  },
  {
    id: '20',
    title: 'Mumbai Late Night',
    from: 'Andheri East',
    to: 'Juhu Beach',
    date: '2026-06-25',
    time: '22:30',
    status: 'ON_DUTY',
    amount: 550,
    distance: '10 km',
    duration: '25m',
    vehicle: 'Hyundai Verna',
    driver: 'Manoj Tiwari',
    guestName: 'Rajesh Khanna',
    phone: '9345678901',
  },
];

// Bookings data
export const bookings: Booking[] = [
  {
    id: '1',
    pickup: 'Mumbai Central',
    dropoff: 'Pune Station',
    date: '2026-06-14',
    time: '08:30',
    passengers: 2,
    vehicleType: 'Sedan',
    notes: 'AC required, 2 large bags',
    status: 'confirmed',
  },
  {
    id: '2',
    pickup: 'Delhi IGI T3',
    dropoff: 'Gurgaon Cyber Hub',
    date: '2026-06-17',
    time: '11:00',
    passengers: 1,
    vehicleType: 'SUV',
    notes: 'Flight AI 302, will land at 10:30',
    status: 'submitted',
  },
  {
    id: '3',
    pickup: 'Bangalore MG Road',
    dropoff: 'Coorg Resort',
    date: '2026-06-20',
    time: '05:30',
    passengers: 4,
    vehicleType: 'Innova Crysta',
    notes: 'Weekend trip, return on 22nd',
    status: 'draft',
  },
];

// Calendar events
export const calendarEvents: CalendarEvent[] = [
  { id: '1', title: 'Mumbai → Pune Trip', date: '2026-06-14', time: '08:30', type: 'trip', status: 'upcoming' },
  { id: '2', title: 'Vehicle Inspection', date: '2026-06-15', time: '10:00', type: 'maintenance', status: 'upcoming' },
  { id: '3', title: 'Team Meeting', date: '2026-06-16', time: '14:00', type: 'meeting', status: 'upcoming' },
  { id: '4', title: 'Chennai Outstation', date: '2026-06-15', time: '07:00', type: 'trip', status: 'upcoming' },
  { id: '5', title: 'Payment Reminder', date: '2026-06-17', time: '11:00', type: 'reminder', status: 'upcoming' },
  { id: '6', title: 'Bangalore Airport', date: '2026-06-15', time: '06:00', type: 'trip', status: 'upcoming' },
  { id: '7', title: 'Delhi Transfer', date: '2026-06-14', time: '14:00', type: 'trip', status: 'upcoming' },
  { id: '8', title: 'Kolkata Transfer', date: '2026-06-14', time: '17:00', type: 'trip', status: 'upcoming' },
];

// Formatters
export const formatCurrency = (amount: number) => '₹' + amount.toLocaleString('en-IN');

// getCalendarTrips API mock
export const getCalendarTrips = (params: { month: string }): Trip[] => {
  const [year, month] = params.month.split('-').map(Number);
  return trips.filter(t => {
    const [tYear, tMonth] = (t.date || '').split('-').map(Number);
    return tYear === year && tMonth === month;
  });
};
