import preview1 from "@/assets/img/stories/preview2/IMG_5285.png";
import preview2 from "@/assets/img/stories/preview2/IMG_5284.png";
import preview3 from "@/assets/img/stories/preview2/IMG_5283.png";
import preview4 from "@/assets/img/stories/preview2/IMG_5282.png";

import preview1_articles from '@/assets/img/stories/preview/1.webp';
import preview2_articles from '@/assets/img/stories/preview/2.webp';
import preview3_articles from '@/assets/img/stories/preview/3.webp';
import preview4_articles from '@/assets/img/stories/preview/4.webp';
import preview5_articles from '@/assets/img/stories/preview/5.webp';

import story1_1 from '@/assets/img/stories/1.1.webp';
import story1_2_1 from '@/assets/img/stories/1.2-1.webp';
import story1_2 from '@/assets/img/stories/1.2.webp';
import story2_1 from '@/assets/img/stories/2.2.webp';
import story3_1 from '@/assets/img/stories/3.2.webp';
import story3_2 from '@/assets/img/stories/3.3.webp';
import story4_1 from '@/assets/img/stories/4.2.webp';
import story5_1 from '@/assets/img/stories/5.2.webp';

const video1 = "/assets/img/stories/IMG_5281.mov";
const video2 = "/assets/img/stories/IMG_5272.mov";
const video3 = "/assets/img/stories/IMG_5268.mov";
const video4 = "/assets/img/stories/IMG_5266.mov";

export const useStoriesData = () => {
  const homeStoriesGroups = [
    {
      id: 4,
      preview: preview4,
      background: "linear-gradient(135deg, #fd79a8 0%, #e84393 100%)",
      stories: [{ id: 1, video: video4 }],
    },
    {
      id: 3,
      preview: preview3,
      background: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
      stories: [{ id: 1, video: video3 }],
    },
    {
      id: 2,
      preview: preview2,
      background: "linear-gradient(135deg, #a8e6cf 0%, #88d8c0 100%)",
      stories: [{ id: 1, video: video2 }],
    },
    {
      id: 1,
      preview: preview1,
      background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
      stories: [{ id: 1, video: video1 }],
    },
  ];

  const articlesStoriesGroups = [
    {
      id: 1,
      preview: preview1_articles,
      background: 'none',
      stories: [
        { id: 1, image: story1_1 },
        { id: 2, image: story1_2_1 },
        { id: 3, image: story1_2 },
      ],
    },
    {
      id: 2,
      preview: preview2_articles,
      background: 'none',
      stories: [
        { id: 1, image: story2_1 },
      ],
    },
    {
      id: 3,
      preview: preview3_articles,
      background: 'none',
      stories: [
        { id: 1, image: story3_1 },
        { id: 2, image: story3_2 },
      ],
    },
    {
      id: 4,
      preview: preview4_articles,
      background: 'none',
      stories: [
        { id: 1, image: story4_1 },
      ],
    },
    {
      id: 5,
      preview: preview5_articles,
      background: 'none',
      stories: [
        { id: 1, image: story5_1 },
      ],
    },
  ];

  return {
    homeStoriesGroups,
    articlesStoriesGroups,
  };
};
