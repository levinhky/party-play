import type { SpyWordPair } from "@/types/spy";

export const spyWordPairs: SpyWordPair[] = [
  // Đồ ăn
  {
    id: "food-1",
    category: "Đồ ăn",
    word: "Phở",
    spyWord: "Bún bò",
  },
  {
    id: "food-2",
    category: "Đồ ăn",
    word: "Pizza",
    spyWord: "Hamburger",
  },
  {
    id: "food-3",
    category: "Đồ ăn",
    word: "Kem",
    spyWord: "Sữa chua",
  },
  {
    id: "food-4",
    category: "Đồ ăn",
    word: "Trà sữa",
    spyWord: "Cà phê sữa",
  },
  {
    id: "food-5",
    category: "Đồ ăn",
    word: "Bánh mì",
    spyWord: "Sandwich",
  },
  {
    id: "food-6",
    category: "Đồ ăn",
    word: "Sushi",
    spyWord: "Cơm cuộn",
  },
  {
    id: "food-7",
    category: "Đồ ăn",
    word: "Gà rán",
    spyWord: "Gà nướng",
  },
  {
    id: "food-8",
    category: "Đồ ăn",
    word: "Bánh kếp",
    spyWord: "Bánh waffle",
  },

  // Động vật
  {
    id: "animal-1",
    category: "Động vật",
    word: "Mèo",
    spyWord: "Hổ",
  },
  {
    id: "animal-2",
    category: "Động vật",
    word: "Chó",
    spyWord: "Sói",
  },
  {
    id: "animal-3",
    category: "Động vật",
    word: "Thỏ",
    spyWord: "Chuột",
  },
  {
    id: "animal-4",
    category: "Động vật",
    word: "Cá heo",
    spyWord: "Cá voi",
  },
  {
    id: "animal-5",
    category: "Động vật",
    word: "Đại bàng",
    spyWord: "Chim ưng",
  },

  // Địa điểm
  {
    id: "place-1",
    category: "Địa điểm",
    word: "Bệnh viện",
    spyWord: "Phòng khám",
  },
  {
    id: "place-2",
    category: "Địa điểm",
    word: "Trường học",
    spyWord: "Trung tâm ngoại ngữ",
  },
  {
    id: "place-3",
    category: "Địa điểm",
    word: "Rạp chiếu phim",
    spyWord: "Nhà hát",
  },
  {
    id: "place-4",
    category: "Địa điểm",
    word: "Sân bay",
    spyWord: "Nhà ga",
  },
  {
    id: "place-5",
    category: "Địa điểm",
    word: "Siêu thị",
    spyWord: "Trung tâm thương mại",
  },

  // Nghề nghiệp
  {
    id: "job-1",
    category: "Nghề nghiệp",
    word: "Bác sĩ",
    spyWord: "Y tá",
  },
  {
    id: "job-2",
    category: "Nghề nghiệp",
    word: "Giáo viên",
    spyWord: "Gia sư",
  },
  {
    id: "job-3",
    category: "Nghề nghiệp",
    word: "Đầu bếp",
    spyWord: "Phụ bếp",
  },
  {
    id: "job-4",
    category: "Nghề nghiệp",
    word: "Nhiếp ảnh gia",
    spyWord: "Nhà quay phim",
  },

  // Thiên nhiên
  {
    id: "nature-1",
    category: "Thiên nhiên",
    word: "Mặt trời",
    spyWord: "Mặt trăng",
  },
  {
    id: "nature-2",
    category: "Thiên nhiên",
    word: "Biển",
    spyWord: "Hồ",
  },
  {
    id: "nature-3",
    category: "Thiên nhiên",
    word: "Núi",
    spyWord: "Đồi",
  },
  {
    id: "nature-4",
    category: "Thiên nhiên",
    word: "Mưa",
    spyWord: "Tuyết",
  },

  // Đồ vật
  {
    id: "object-1",
    category: "Đồ vật",
    word: "Điện thoại",
    spyWord: "Máy tính bảng",
  },
  {
    id: "object-2",
    category: "Đồ vật",
    word: "Đồng hồ",
    spyWord: "Đồng hồ báo thức",
  },
  {
    id: "object-3",
    category: "Đồ vật",
    word: "Bút chì",
    spyWord: "Bút bi",
  },
  {
    id: "object-4",
    category: "Đồ vật",
    word: "Ô",
    spyWord: "Áo mưa",
  },
];

export const spyCategories = [
  "Tất cả chủ đề",
  ...Array.from(new Set(spyWordPairs.map((pair) => pair.category))),
];
