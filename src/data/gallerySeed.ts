import { MediaItem } from '../types';

export const initialGalleryItems: MediaItem[] = [
  {
    id: 'gal-1',
    title: 'Ganpati Bappa 36" Rose & Zari Mala Darshan',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
    category: 'ganpati_darshan',
    tags: ['Ganesha', 'Red Rose', 'Temple Darshan'],
    date: '18 May 2024',
    likes: 482,
    location: 'Siddhivinayak Temple, Mumbai'
  },
  {
    id: 'gal-2',
    title: 'Lalbaugcha Raja Divine Aarti & Floral Garland',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
    category: 'temple_events',
    tags: ['Aarti', 'Mogra', 'Lalbaug'],
    date: '20 May 2024',
    likes: 924,
    location: 'Mumbai Pandal',
    videoDuration: '1:45'
  },
  {
    id: 'gal-3',
    title: 'Customer Home Mandir Sthapana Decor',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&auto=format&fit=crop&q=80',
    category: 'customer_photos',
    tags: ['Home Mandir', 'Devotee Decor'],
    date: '22 May 2024',
    likes: 318,
    location: 'Ahmedabad'
  },
  {
    id: 'gal-4',
    title: 'Madurai Mogra Bud Needle Weaving by Master Artisan',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=400&auto=format&fit=crop&q=80',
    category: 'artisan_handcraft',
    tags: ['Karigari', 'Handcraft', 'Jasmine'],
    date: '15 May 2024',
    likes: 560,
    location: 'Madurai Workshops',
    videoDuration: '2:30'
  },
  {
    id: 'gal-5',
    title: 'Rajwada Imperial Varmala Ceremony in Udaipur',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80',
    category: 'varmala_wedding',
    tags: ['Wedding', 'Varmala', 'Royal Couple'],
    date: '12 May 2024',
    likes: 742,
    location: 'Udaipur Palace'
  },
  {
    id: 'gal-6',
    title: 'Tirupati Balaji Maha Prasadam Grand Har Decor',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400&auto=format&fit=crop&q=80',
    category: 'temple_events',
    tags: ['Balaji', 'Grand Temple', 'Cardamom Mala'],
    date: '10 May 2024',
    likes: 689,
    location: 'Tirumala'
  },
  {
    id: 'gal-7',
    title: 'Lotus Bud Blooming Aarti Video Experience',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&auto=format&fit=crop&q=80',
    category: 'ganpati_darshan',
    tags: ['Lotus', 'Devotion', 'Aarti'],
    date: '08 May 2024',
    likes: 812,
    location: 'Pune Mandir',
    videoDuration: '3:12'
  },
  {
    id: 'gal-8',
    title: 'Society Ganpati Pandal 28" Marigold Har',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1602615509930-4e365022839b?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1602615509930-4e365022839b?w=400&auto=format&fit=crop&q=80',
    category: 'customer_photos',
    tags: ['Genda Har', 'Festive Pandal'],
    date: '05 May 2024',
    likes: 420,
    location: 'Nagpur'
  }
];

// Helper to generate a massive collection of 1000 items on demand
export const generate1000GalleryItems = (): MediaItem[] => {
  const imagesPool = [
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1602615509930-4e365022839b?w=800&auto=format&fit=crop&q=80'
  ];

  const categories: MediaItem['category'][] = [
    'ganpati_darshan',
    'customer_photos',
    'temple_events',
    'artisan_handcraft',
    'varmala_wedding'
  ];

  const titles = [
    'Shree Ganesh Divya Darshan With Red Rose Mala',
    'Fragrant Madurai Mogra Garland In Devotee Sanctum',
    'Kesariya Marigold & Durva Temple Har Celebration',
    'Royal Wedding Varmala Drape In Heritage Palace',
    'Artisans Handcrafting Golden Zari Floral Latkans',
    'Siddhivinayak Live Morning Aarti Fresh Flower Decor',
    'Ashtavinayak Lotus Bud Mala Sthapana Ceremony',
    'Mahalaxmi Sugandhit Jasmine Veni & Grand Garland'
  ];

  const locations = ['Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Nagpur', 'Varanasi', 'Delhi NCR', 'Madurai', 'Bangalore', 'Jaipur'];

  const result: MediaItem[] = [];

  for (let i = 1; i <= 1000; i++) {
    const isVideo = i % 4 === 0;
    const imgIndex = (i - 1) % imagesPool.length;
    const catIndex = (i - 1) % categories.length;
    const titleIndex = (i - 1) % titles.length;
    const locIndex = (i - 1) % locations.length;

    result.push({
      id: `gal-item-${i}`,
      title: `${titles[titleIndex]} #${i}`,
      type: isVideo ? 'video' : 'image',
      url: imagesPool[imgIndex],
      thumbnailUrl: imagesPool[imgIndex],
      category: categories[catIndex],
      tags: ['Divine', isVideo ? 'Video' : 'Photo', categories[catIndex].replace('_', ' ')],
      date: `${((i % 28) + 1).toString().padStart(2, '0')} May 2024`,
      likes: 100 + (i * 7) % 850,
      location: locations[locIndex],
      videoDuration: isVideo ? `${1 + (i % 3)}:${(10 + (i * 13) % 49)}` : undefined
    });
  }

  return result;
};
