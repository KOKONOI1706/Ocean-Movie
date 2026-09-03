import { EditorialCollection, Creator, UserTasteProfile } from '../types';

export const EDITORIAL_COLLECTIONS: EditorialCollection[] = [
  {
    id: 'weekend-ocean',
    title: 'Biển Phim Cuối Tuần',
    subtitle: 'HÀNH TRÌNH THƯ GIÃN CHO NHỮNG NGÀY NGHỈ',
    curator: 'Ban Biên Tập Biển Phim',
    issue: 'TUYỂN TẬP ĐẶC SẮC',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    description: 'Những tác phẩm điện ảnh ấm áp, tươi mới và giàu năng lượng tích cực, lý tưởng để tận hưởng bên tách trà chiều cuối tuần.',
    tags: ['Cuối Tuần', 'Thư Giãn', 'Cảm Xúc', 'Hòa Mình'],
    itemIds: ['perfect-days', 'past-lives', 'frieren-journey', 'spirited-away', 'after-yang']
  },
  {
    id: 'late-night-cinema',
    title: 'Phim Cho Đêm Khuya',
    subtitle: 'KHI MÀN ĐÊM BUÔNG VÀ ĐẠI DƯƠNG CHÌM VÀO TĨNH LẶNG',
    curator: 'Hải Trình Về Đêm',
    issue: 'ĐÊM NGOÀI KHƠI',
    heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
    description: 'Ánh sáng neon mờ ảo, không gian huyền bí và âm hưởng trầm lắng dành cho những tâm hồn thao thức giữa đêm trăng.',
    tags: ['Đêm Khuya', 'Trầm Lắng', 'Bí Ẩn', 'Neo-Noir'],
    itemIds: ['blade-runner-2049', 'severance', 'the-last-signal', 'dark']
  },
  {
    id: 'thought-provoking',
    title: 'Những Bộ Phim Khiến Bạn Suy Nghĩ',
    subtitle: 'CHIÊM NGHIỆM VỀ CUỘC ĐỜI, KÝ ỨC VÀ TƯƠNG LAI',
    curator: 'Tiến Sĩ Hải Đăng',
    issue: 'TRIẾT LÝ ĐIỆN ẢNH',
    heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85',
    description: 'Những bộ phim đặt ra những câu hỏi sâu sắc về bản ngã con người, chiều không gian và vòng lặp vô tận của thời gian.',
    tags: ['Triết Học', 'Hại Não', 'Khoa Học Viễn Tưởng'],
    itemIds: ['interstellar', 'dark', 'after-yang', 'stalker', 'severance']
  },
  {
    id: 'binge-weekend-series',
    title: 'Series Một Cuối Tuần Là Xong',
    subtitle: 'CỐT TRUYỆN LIỀN MẠCH, CUỐN HÚT KHÔNG THỂ DỪNG LẠI',
    curator: 'Hải Trình Dài',
    issue: 'SERIES TUYỂN CHỌN',
    heroImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=85',
    description: 'Các mini-series và mùa phim có thời lượng vừa vặn, kết cấu chặt chẽ, đưa bạn vào một chuyến hải trình ly kỳ từ tập đầu đến tập cuối.',
    tags: ['Binge-Watch', 'Series Ngắn', 'Kịch Tính'],
    itemIds: ['severance', 'dark', 'frieren-journey']
  },
  {
    id: 'hidden-gems-deep-sea',
    title: 'Vùng Nước Sâu (Hidden Gems)',
    subtitle: 'NHỮNG VIÊN NGỌC ẨN MÌNH DƯỚI ĐÁY ĐẠI DƯƠNG ĐIỆN ẢNH',
    curator: 'Ban Giám Tuyển Độc Lập',
    issue: 'KHO TÀNG ẨN GIẤU',
    heroImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=85',
    description: 'Những kiệt tác điện ảnh độc lập ít được quảng bá rầm rộ nhưng sở hữu giá trị nghệ thuật và xúc cảm vượt trội.',
    tags: ['Độc Lập', 'Hiếm Có', 'Nghệ Thuật Đích Thực'],
    itemIds: ['after-yang', 'the-last-signal', 'stalker', 'chronicle-metropolis']
  },
  {
    id: 'ai-films-must-watch',
    title: 'Phim AI Đáng Xem',
    subtitle: 'GIAO THOA ĐỘT PHÁ GIỮA NGHỆ THUẬT VÀ TRÍ TUỆ NHÂN TẠO',
    curator: 'Phòng Thí Nghiệm Biển AI',
    issue: 'CÔNG NGHỆ & TƯƠNG LAI',
    heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
    description: 'Khám phá ngôn ngữ điện ảnh mới do các đạo diễn tiên phong kết hợp cùng các mô hình sáng tạo AI tạo sinh thế hệ mới.',
    tags: ['AI Film', 'Generative Cinema', 'Tương Lai'],
    itemIds: ['the-last-signal', 'chronicle-metropolis', 'son-of-sun', 'memory-archive-09']
  },
  {
    id: 'films-under-30-min',
    title: 'Phim Dưới 30 Phút',
    subtitle: 'CÔ ĐỌNG, MẠNH MẼ VÀ ĐẬM NÉT ĐIỆN ẢNH',
    curator: 'Đảo Ngắn Curators',
    issue: 'PHIM NGẮN CHỌN LỌC',
    heroImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=85',
    description: 'Những câu chuyện súc tích, hoàn hảo cho những khoảng lặng ngắn trong ngày nhưng để lại dư ba kéo dài.',
    tags: ['Dưới 30 Phút', 'Phim Ngắn', 'Ấn Tượng'],
    itemIds: ['the-last-signal', 'son-of-sun', 'chronicle-metropolis']
  },
  {
    id: 'sci-fi-open-sea',
    title: 'Sci-Fi Ngoài Khơi',
    subtitle: 'VƯỢT XA GIỚI HẠN VŨ TRỤ VÀ KHÔNG GIAN ĐA CHIỀU',
    curator: 'Hải Trình Vũ Trụ',
    issue: 'KHOA HỌC VIỄN TƯỞNG',
    heroImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=85',
    description: 'Từ những chuyến thám hiểm hố đen vĩ đại đến trạm phát tín hiệu đơn độc ở rìa thái dương hệ.',
    tags: ['Vũ Trụ', 'Sci-Fi Đỉnh Cao', 'Hành Trình'],
    itemIds: ['interstellar', 'blade-runner-2049', 'the-last-signal', 'son-of-sun']
  }
];

export const CREATORS_DATA: Creator[] = [
  {
    id: 'elena-vance',
    name: 'Elena Vance',
    role: 'Đạo diễn AI & Hệ thống Sáng tạo',
    portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
    bio: 'Nữ đạo diễn tiên phong kết hợp phim nhựa 70mm analog cùng các mô hình khuếch tán thần kinh tạo sinh. Tốt nghiệp Le Fresnoy trước khi sáng lập Latent Lab tại Zurich.',
    bornLocation: 'Zurich / Berlin',
    manifesto: '“Công nghệ không thay thế ống kính; nó mở ra một đại dương vô tận của những giấc mơ tiềm ẩn.”',
    filmsCount: 6,
    followers: 48200,
    views: '1.4M',
    toolsUsed: ['Sora 2.0', 'Optical Grain Printer', 'Runway Gen-3', 'Kyma Sound'],
    knownFor: ['The Last Signal', 'Spectral Transit', 'Sub-Aura']
  },
  {
    id: 'baran-bo-odar',
    name: 'Baran bo Odar & Jantje Friese',
    role: 'Showrunner & Biên Kịch Điện Ảnh',
    portrait: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85',
    bio: 'Bộ đôi nhà làm phim người Đức nổi tiếng thế giới với phong cách kết cấu không gian - thời gian đa tầng, kịch tính tâm lý nghẹt thở và chất điện ảnh u tối tuyệt mỹ.',
    bornLocation: 'Olten, Thụy Sĩ / Đức',
    manifesto: '“Mọi câu chuyện đều là một vòng tròn. Điểm kết thúc chỉ là nơi hải trình quay trở lại điểm khởi đầu.”',
    filmsCount: 7,
    followers: 184000,
    views: '42M',
    toolsUsed: ['RED Monstro 8K', 'Hasselblad Prime Glass', 'Original Cell Synthesizers'],
    knownFor: ['Dark', '1899', 'Who Am I']
  },
  {
    id: 'celine-song',
    name: 'Celine Song',
    role: 'Biên kịch & Đạo diễn',
    portrait: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=85',
    bio: 'Nữ đạo diễn gốc Hàn - Canada được tôn vinh toàn cầu với tác phẩm Past Lives, mang đến sự tinh tế tột bậc về duyên nợ (In-Yeon) và nỗi niềm hoài niệm sâu lắng.',
    bornLocation: 'Seoul, Hàn Quốc / New York',
    manifesto: '“Điện ảnh chân thực nhất diễn ra trong hai giây im lặng sau khi một người hỏi điều họ đã biết rõ câu trả lời.”',
    filmsCount: 3,
    followers: 122000,
    views: '18M',
    toolsUsed: ['35mm Panavision Panaflex', 'Ánh sáng tự nhiên'],
    knownFor: ['Past Lives', 'The Wheel', 'Endlings']
  }
];

export const INITIAL_USER_TASTE: UserTasteProfile = {
  name: 'Nguyễn Duy Cương',
  memberSince: 'Thành viên Hải Trình · Tháng 9, 2026',
  editorialSummary: 'Bạn có xu hướng thích sci-fi chậm, giàu cảm xúc, kết hợp với những câu chuyện về con người và công nghệ sâu lắng. Bạn đặc biệt yêu thích những tác phẩm có phong cách hình ảnh đẹp mắt và âm thanh du dương.',
  topGenres: [
    { genre: 'Khoa học viễn tưởng (Sci-Fi)', percentage: 38 },
    { genre: 'Tâm lý & Bí ẩn (Mystery)', percentage: 26 },
    { genre: 'Điện ảnh thư thái (Slow Cinema)', percentage: 21 },
    { genre: 'Phim AI & Thử nghiệm', percentage: 15 }
  ],
  favoriteMoods: ['curious', 'lonely', 'romantics', 'night-owls'],
  activeStreamingServices: ['Netflix', 'YouTube', 'Apple TV+', 'Prime Video'],
  stats: {
    filmsWatched: 42,
    hoursLogged: 78,
    aiFilmsDiscovered: 12,
    notesWritten: 19
  }
};
