import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ImageState {
  id: string;
  url: string;
  size: number;
  shadow: boolean;
  position: {
    x: number;
    y: number;
  };
}

interface BannerState {
  title: string;
  subtitle: string;
  titleSize: number;
  subtitleSize: number;
  backgroundColor: string;
  gradientColor: string;
  images: ImageState[];
  aspectRatio: string;
  textAlignment: 'top' | 'center' | 'bottom';
  padding: {
    top: number;
    bottom: number;
    left: number;
  };
  titleColor: string;
  subtitleColor: string;
  textWidth: number;
  fontFamily: string;
  showBorder: boolean;
  borderWidth: number;
  borderColor: string;
}

const ASPECT_RATIOS = {
  'facebook': { width: 1200, height: 628, ratio: '1.91:1' },
  'twitter': { width: 1200, height: 675, ratio: '16:9' },
  'instagram': { width: 1080, height: 1080, ratio: '1:1' },
  'linkedin': { width: 1200, height: 627, ratio: '1.91:1' },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;
export { ASPECT_RATIOS };

export const defaultState: BannerState = {
  title: 'Your Title Here',
  subtitle: 'Your subtitle goes here',
  titleSize: 48,
  subtitleSize: 20,
  backgroundColor: '#3B82F6',
  gradientColor: '#9333EA',
  images: [],
  aspectRatio: 'facebook',
  textAlignment: 'center',
  padding: {
    top: 64,
    bottom: 64,
    left: 64
  },
  titleColor: '#FFFFFF',
  subtitleColor: '#FFFFFF',
  textWidth: 60,
  fontFamily: 'Arial',
  showBorder: false,
  borderWidth: 4,
  borderColor: '#000000'
};

const loadState = (): BannerState => {
  try {
    const serializedState = localStorage.getItem('bannerState');
    if (serializedState === null) {
      return defaultState;
    }
    const savedState = JSON.parse(serializedState);
    
    return {
      ...defaultState,
      ...savedState,
      images: savedState.images ?? [],
      padding: {
        top: savedState.padding?.top ?? defaultState.padding.top,
        bottom: savedState.padding?.bottom ?? defaultState.padding.bottom,
        left: savedState.padding?.left ?? defaultState.padding.left
      },
      textAlignment: savedState.textAlignment ?? defaultState.textAlignment,
      titleColor: savedState.titleColor ?? defaultState.titleColor,
      subtitleColor: savedState.subtitleColor ?? defaultState.subtitleColor,
      textWidth: savedState.textWidth ?? defaultState.textWidth,
      fontFamily: savedState.fontFamily ?? defaultState.fontFamily,
      showBorder: savedState.showBorder ?? defaultState.showBorder,
      borderWidth: savedState.borderWidth ?? defaultState.borderWidth,
      borderColor: savedState.borderColor ?? defaultState.borderColor
    };
  } catch (err) {
    return defaultState;
  }
};

const saveState = (state: BannerState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('bannerState', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

export const bannerSlice = createSlice({
  name: 'banner',
  initialState: loadState(),
  reducers: {
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
      saveState(state);
    },
    setSubtitle: (state, action: PayloadAction<string>) => {
      state.subtitle = action.payload;
      saveState(state);
    },
    setTitleSize: (state, action: PayloadAction<number>) => {
      state.titleSize = action.payload;
      saveState(state);
    },
    setSubtitleSize: (state, action: PayloadAction<number>) => {
      state.subtitleSize = action.payload;
      saveState(state);
    },
    setBackgroundColor: (state, action: PayloadAction<string>) => {
      state.backgroundColor = action.payload;
      saveState(state);
    },
    setGradientColor: (state, action: PayloadAction<string>) => {
      state.gradientColor = action.payload;
      saveState(state);
    },
    addImage: (state, action: PayloadAction<string>) => {
      const newImage: ImageState = {
        id: Date.now().toString(),
        url: action.payload,
        size: 400,
        shadow: false,
        position: { x: 0, y: 0 }
      };
      state.images.push(newImage);
      saveState(state);
    },
    removeImage: (state, action: PayloadAction<string>) => {
      state.images = state.images.filter(img => img.id !== action.payload);
      saveState(state);
    },
    updateImagePosition: (state, action: PayloadAction<{ id: string; position: { x: number; y: number } }>) => {
      const image = state.images.find(img => img.id === action.payload.id);
      if (image) {
        image.position = action.payload.position;
        saveState(state);
      }
    },
    updateImageSize: (state, action: PayloadAction<{ id: string; size: number }>) => {
      const image = state.images.find(img => img.id === action.payload.id);
      if (image) {
        image.size = action.payload.size;
        saveState(state);
      }
    },
    updateImageShadow: (state, action: PayloadAction<{ id: string; shadow: boolean }>) => {
      const image = state.images.find(img => img.id === action.payload.id);
      if (image) {
        image.shadow = action.payload.shadow;
        saveState(state);
      }
    },
    setAspectRatio: (state, action: PayloadAction<AspectRatioKey>) => {
      state.aspectRatio = action.payload;
      saveState(state);
    },
    setTextAlignment: (state, action: PayloadAction<'top' | 'center' | 'bottom'>) => {
      state.textAlignment = action.payload;
      saveState(state);
    },
    setPadding: (state, action: PayloadAction<{ key: 'top' | 'bottom' | 'left', value: number }>) => {
      state.padding[action.payload.key] = action.payload.value;
      saveState(state);
    },
    setTitleColor: (state, action: PayloadAction<string>) => {
      state.titleColor = action.payload;
      saveState(state);
    },
    setSubtitleColor: (state, action: PayloadAction<string>) => {
      state.subtitleColor = action.payload;
      saveState(state);
    },
    setTextWidth: (state, action: PayloadAction<number>) => {
      state.textWidth = action.payload;
      saveState(state);
    },
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.fontFamily = action.payload;
      saveState(state);
    },
    setShowBorder: (state, action: PayloadAction<boolean>) => {
      state.showBorder = action.payload;
      saveState(state);
    },
    setBorderWidth: (state, action: PayloadAction<number>) => {
      state.borderWidth = action.payload;
      saveState(state);
    },
    setBorderColor: (state, action: PayloadAction<string>) => {
      state.borderColor = action.payload;
      saveState(state);
    },
    resetToDefault: (state) => {
      Object.assign(state, defaultState);
      saveState(state);
    }
  }
});

export const {
  setTitle,
  setSubtitle,
  setTitleSize,
  setSubtitleSize,
  setBackgroundColor,
  setGradientColor,
  addImage,
  removeImage,
  updateImagePosition,
  updateImageSize,
  updateImageShadow,
  setAspectRatio,
  setTextAlignment,
  setPadding,
  setTitleColor,
  setSubtitleColor,
  setTextWidth,
  setFontFamily,
  setShowBorder,
  setBorderWidth,
  setBorderColor,
  resetToDefault
} = bannerSlice.actions;

export default bannerSlice.reducer;