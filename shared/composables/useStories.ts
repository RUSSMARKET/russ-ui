import { ref, computed, onUnmounted } from 'vue';

export type Story = {
  id: string | number;
  image?: string;
  video?: string;
  durationMs?: number;
  videoDuration?: number;
};

export type StoryGroup = {
  id: string | number;
  preview?: string;
  background?: string;
  stories: Story[];
};

type UseStoriesReturn = {
  showStoriesModal: ReturnType<typeof ref<boolean>>;
  currentStoriesGroupIndex: ReturnType<typeof ref<number>>;
  currentStoriesIndex: ReturnType<typeof ref<number>>;
  storiesProgress: ReturnType<typeof ref<number>>;
  isStoriesPaused: ReturnType<typeof ref<boolean>>;
  isStoriesLoading: ReturnType<typeof ref<boolean>>;
  isVideoReady: ReturnType<typeof ref<boolean>>;
  currentStories: ComputedRef<Story[]>;
  currentStory: ComputedRef<Story | null>;
  openGroup: (groupIndex: number) => Promise<void>;
  closeStoriesModal: () => void;
  nextStory: () => Promise<void>;
  prevStory: () => Promise<void>;
  pauseStory: () => void;
  resumeStory: () => void;
  pauseVideo: () => void;
  resumeVideo: () => void;
};

const DEFAULT_STORY_DURATION_MS = 5000;
const TICK_MS = 100;

export function useStories(groupsInput: StoryGroup[]): UseStoriesReturn {
  const groups = ref<StoryGroup[]>(Array.isArray(groupsInput) ? groupsInput : []);

  const showStoriesModal = ref<boolean>(false);
  const currentStoriesGroupIndex = ref<number>(0);
  const currentStoriesIndex = ref<number>(0);
  const storiesProgress = ref<number>(0);
  const isStoriesPaused = ref<boolean>(true);
  const isStoriesLoading = ref<boolean>(false);
  const isVideoReady = ref<boolean>(false);
  

  const currentStories = computed<Story[]>(() => {
    const group = groups.value[currentStoriesGroupIndex.value];
    return group && Array.isArray(group.stories) ? group.stories : [];
  });

  const currentStory = computed<Story | null>(() => {
    return currentStories.value[currentStoriesIndex.value] || null;
  });

  function getCurrentVideoElement(): HTMLVideoElement | null {
    return document.querySelector('.story-video') as HTMLVideoElement;
  }

  function pauseVideo(): void {
    const videoElement = getCurrentVideoElement();
    if (videoElement && !videoElement.paused) {
      try {
        videoElement.pause();
      } catch (error) {
        console.warn('Ошибка при паузе видео:', error);
      }
    }
  }

  function resumeVideo(): void {
    const videoElement = getCurrentVideoElement();
    if (videoElement && videoElement.paused) {
      try {
        if (videoElement.readyState >= 3) {
          videoElement.play().catch((error) => {
            console.warn('Ошибка при воспроизведении видео:', error);
          });
        }
      } catch (error) {
        console.warn('Ошибка при воспроизведении видео:', error);
      }
    }
  }

  async function preloadAssets(groupIndex: number): Promise<void> {
    const group = groups.value[groupIndex];
    if (!group) return;

    const promises: Promise<void>[] = [];

    for (const story of group.stories) {
      if (story.image) {
        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = story.image!;
          })
        );
      }
      
      if (story.video && !story.videoDuration) {
        promises.push(
          new Promise<void>((resolve) => {
            const video = document.createElement('video');
            let metadataLoaded = false;
            
            const checkDuration = () => {
              if (video.duration && video.duration > 0 && !metadataLoaded) {
                metadataLoaded = true;
                story.videoDuration = Math.round(video.duration * 1000);
                resolve();
              }
            };
            
            video.onloadedmetadata = checkDuration;
            video.oncanplay = checkDuration;
            video.onloadeddata = checkDuration;
            
            setTimeout(() => {
              if (!metadataLoaded) {
                metadataLoaded = true;
                resolve();
              }
            }, 5000);
            
            video.onerror = () => {
              if (!metadataLoaded) {
                metadataLoaded = true;
                resolve();
              }
            };
            
            video.src = story.video!;
            video.load();
          })
        );
      }
    }

    await Promise.all(promises);
  }

  let progressTimerId: number | null = null;
  let videoReadyTimerId: number | null = null;
  let videoStartCheckInterval: number | null = null;

  function getCurrentStoryDuration(): number {
    const story = currentStory.value;
    if (!story) return DEFAULT_STORY_DURATION_MS;
    
    if (story.durationMs && story.durationMs > 0) {
      return story.durationMs;
    }
    
    if (story.video && story.videoDuration && story.videoDuration > 0) {
      return story.videoDuration;
    }
    
    return DEFAULT_STORY_DURATION_MS;
  }

  function startProgressTimer(): void {
    stopProgressTimer();
    if (!showStoriesModal.value || isStoriesPaused.value) {
      return;
    }
    
    const story = currentStory.value;
    if (story && story.video) {
      waitForVideoReady();
      return;
    }
    
    startTimerImmediately();
  }

  function waitForVideoReady(): void {
    isVideoReady.value = false;
    
    if (videoReadyTimerId !== null) {
      clearInterval(videoReadyTimerId);
      videoReadyTimerId = null;
    }
    
    videoReadyTimerId = window.setInterval(() => {
      if (isStoriesPaused.value) {
        if (videoReadyTimerId !== null) {
          clearInterval(videoReadyTimerId);
          videoReadyTimerId = null;
        }
        return;
      }
      
      const videoElement = document.querySelector('.story-video') as HTMLVideoElement;
      
      if (videoElement && videoElement.readyState >= 3 && videoElement.duration > 0) {
        isVideoReady.value = true;
        if (videoReadyTimerId !== null) {
          clearInterval(videoReadyTimerId);
          videoReadyTimerId = null;
        }
        waitForVideoToStart();
      }
    }, 100);
    
    setTimeout(() => {
      if (videoReadyTimerId !== null) {
        clearInterval(videoReadyTimerId);
        videoReadyTimerId = null;
        isVideoReady.value = true;
        if (!isStoriesPaused.value) {
          startTimerImmediately();
        }
      }
    }, 10000);
  }

  function waitForVideoToStart(): void {
    const videoElement = document.querySelector('.story-video') as HTMLVideoElement;
    if (!videoElement) return;
    
    videoStartCheckInterval = window.setInterval(() => {
      if (isStoriesPaused.value) {
        if (videoStartCheckInterval !== null) {
          clearInterval(videoStartCheckInterval);
          videoStartCheckInterval = null;
        }
        return;
      }
      
      if (videoElement.currentTime > 0 && !videoElement.paused) {
        if (videoStartCheckInterval !== null) {
          clearInterval(videoStartCheckInterval);
          videoStartCheckInterval = null;
        }
        startTimerImmediately();
      }
    }, 50);
    
    const onPlay = () => {
      if (videoStartCheckInterval !== null) {
        clearInterval(videoStartCheckInterval);
        videoStartCheckInterval = null;
      }
      videoElement.removeEventListener('play', onPlay);
      if (!isStoriesPaused.value) {
        startTimerImmediately();
      }
    };
    
    videoElement.addEventListener('play', onPlay);
    
    setTimeout(() => {
      if (videoStartCheckInterval !== null) {
        clearInterval(videoStartCheckInterval);
        videoStartCheckInterval = null;
      }
      videoElement.removeEventListener('play', onPlay);
      if (!isStoriesPaused.value) {
        startTimerImmediately();
      }
    }, 3000);
  }

  function startTimerImmediately(): void {
    if (isStoriesPaused.value) {
      return;
    }
    
    progressTimerId = window.setInterval(async () => {
      if (!showStoriesModal.value || isStoriesPaused.value) return;
      
      const story = currentStory.value;
      if (story && story.video) {
        const videoElement = document.querySelector('.story-video') as HTMLVideoElement;
        if (videoElement && videoElement.duration > 0) {
          const currentTime = videoElement.currentTime;
          const duration = videoElement.duration;
          const progress = (currentTime / duration) * 100;
          
          if (!videoElement.paused && currentTime > 0) {
            storiesProgress.value = progress;
          }
          
          if (currentTime >= duration - 0.05) {
            try {
              await nextStory();
            } catch (error) {
              console.warn('Ошибка при переходе к следующей истории:', error);
            }
          }
        }
        return;
      }
      
      const durationMs = getCurrentStoryDuration();
      const increment = (100 * TICK_MS) / durationMs;
      storiesProgress.value += increment;
      if (storiesProgress.value >= 100) {
        try {
          await nextStory();
        } catch (error) {
          console.warn('Ошибка при переходе к следующей истории:', error);
        }
      }
    }, TICK_MS);
  }

  function stopProgressTimer(): void {
    if (progressTimerId !== null) {
      window.clearInterval(progressTimerId);
      progressTimerId = null;
    }
    
    if (videoReadyTimerId !== null) {
      window.clearInterval(videoReadyTimerId);
      videoReadyTimerId = null;
    }
    
    if (videoStartCheckInterval !== null) {
      window.clearInterval(videoStartCheckInterval);
      videoStartCheckInterval = null;
    }
  }

  function resetProgress(): void {
    storiesProgress.value = 0;
    isVideoReady.value = false;
    
    const story = currentStory.value;
    if (story && story.video) {
      const videoElement = document.querySelector('.story-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.currentTime = 0;
        const onVideoEnded = async () => {
          storiesProgress.value = 100;
          videoElement.removeEventListener('ended', onVideoEnded);
          try {
            await nextStory();
          } catch (error) {
            console.warn('Ошибка при переходе к следующей истории:', error);
          }
        };
        videoElement.addEventListener('ended', onVideoEnded);
      }
    }
  }

  async function openGroup(groupIndex: number): Promise<void> {
    if (groupIndex < 0 || groupIndex >= groups.value.length) return;
    
    isStoriesLoading.value = true;
    isStoriesPaused.value = true;
    
    try {
      await preloadAssets(groupIndex);
      
      const promises: Promise<void>[] = [];
      
      if (groupIndex > 0) {
        promises.push(preloadAssets(groupIndex - 1).catch(() => {}));
      }
      
      if (groupIndex < groups.value.length - 1) {
        promises.push(preloadAssets(groupIndex + 1).catch(() => {}));
      }
      
      if (promises.length > 0) {
        Promise.all(promises);
      }
      
      currentStoriesGroupIndex.value = groupIndex;
      currentStoriesIndex.value = 0;
      resetProgress();
      showStoriesModal.value = true;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      isStoriesPaused.value = false;
      stopProgressTimer();
      startProgressTimer();
    } finally {
      isStoriesLoading.value = false;
    }
  }

  function closeStoriesModal(): void {
    showStoriesModal.value = false;
    stopProgressTimer();
    resetProgress();
    isStoriesPaused.value = true;
  }

  async function nextStory(): Promise<void> {
    const stories = currentStories.value;
    if (currentStoriesIndex.value < stories.length - 1) {
      currentStoriesIndex.value += 1;
      resetProgress();
      if (showStoriesModal.value) {
        isStoriesPaused.value = false;
        stopProgressTimer();
        startProgressTimer();
      }
      return;
    }
    const nextGroupIndex = currentStoriesGroupIndex.value + 1;
    const hasNextGroup = nextGroupIndex < groups.value.length;
    const currentGroup = groups.value[currentStoriesGroupIndex.value];

    if (hasNextGroup) {
      try {
        await preloadAssets(nextGroupIndex);
      } catch (error) {
        console.warn('Ошибка при предзагрузке ассетов:', error);
      }
      
      currentStoriesGroupIndex.value = nextGroupIndex;
      currentStoriesIndex.value = 0;
      resetProgress();
      if (showStoriesModal.value) {
        isStoriesPaused.value = false;
        stopProgressTimer();
        startProgressTimer();
      }
    } else {
      closeStoriesModal();
    }
  }

  async function prevStory(): Promise<void> {
    if (currentStoriesIndex.value > 0) {
      currentStoriesIndex.value -= 1;
      resetProgress();
      if (showStoriesModal.value) {
        isStoriesPaused.value = false;
        stopProgressTimer();
        startProgressTimer();
      }
      return;
    }
    const prevGroupIndex = currentStoriesGroupIndex.value - 1;
    if (prevGroupIndex >= 0) {
      try {
        await preloadAssets(prevGroupIndex);
      } catch (error) {
        console.warn('Ошибка при предзагрузке ассетов:', error);
      }
      
      currentStoriesGroupIndex.value = prevGroupIndex;
      const prevGroupStories = groups.value[prevGroupIndex]?.stories || [];
      currentStoriesIndex.value = prevGroupStories.length > 0 ? prevGroupStories.length - 1 : 0;
      resetProgress();
      if (showStoriesModal.value) {
        isStoriesPaused.value = false;
        stopProgressTimer();
        startProgressTimer();
      }
    }
  }

  function pauseStory(): void {
    if (currentStory.value?.video && !isVideoReady.value) {
      return; 
    }
    
    isStoriesPaused.value = true;
    stopProgressTimer();
    
    if (currentStory.value?.video) {
      pauseVideo();
    }
  }

  function resumeStory(): void {
    if (showStoriesModal.value) {
      isStoriesPaused.value = false;
      
      if (currentStory.value?.video) {
        resumeVideo();
      }
      
      startProgressTimer();
    }
  }

  onUnmounted(() => {
    stopProgressTimer();
    
    if (videoReadyTimerId !== null) {
      window.clearInterval(videoReadyTimerId);
      videoReadyTimerId = null;
    }
    
    if (videoStartCheckInterval !== null) {
      window.clearInterval(videoStartCheckInterval);
      videoStartCheckInterval = null;
    }
  });

  return {
    showStoriesModal,
    currentStoriesGroupIndex,
    currentStoriesIndex,
    storiesProgress,
    isStoriesPaused,
    isStoriesLoading,
    isVideoReady,
    currentStories,
    currentStory,
    openGroup,
    closeStoriesModal,
    nextStory,
    prevStory,
    pauseStory,
    resumeStory,
    pauseVideo,
    resumeVideo,
  };
}


